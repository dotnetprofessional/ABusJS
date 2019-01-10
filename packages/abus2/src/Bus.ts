import { IBus } from "./IBus";
import { IMessage } from "./IMessage";
import { SendOptions } from "./SendOptions";
import { IMessageTransport } from "./Transports/IMessageTransport";
import { IHashTable } from "./IHashTable";
import { Intents } from "./Intents";
import { PipelineContext } from "./Pipeline";
import { IRegisteredTransport } from "./IRegisteredTransport";
import { ExecuteHandlerTask } from "./tasks/ExecuteHandlerTask";
import { IMessageHandler } from "./IMessageHandler";
import { newGuid } from "./Guid";
import { IMessageSubscription } from "./IMessageSubscription";
import { TransportDispatchTask } from "./tasks/TransportDispatchTask";
import { AbusGrammar, TransportGrammar } from "./fluent/transportGrammar";
import { IMessageTask } from "./tasks/IMessageTask";
import { MessageHandlerContext } from "./MessageHandlerContext";
import { ReplyHandler } from "./ReplyHandler";
import { ReplyRequest } from "./ReplyRequest";
import { ExpressMemoryTransport } from "./Transports/ExpressMemoryTransport";
import { MessageExceptionTask } from "./tasks/MessageExceptionTask";
import { MessageException } from "./tasks/MessageException";
import { getTypeNamespace } from "./Utils";
import { IMessageHandlerContext } from "./IMessageHandlerContext";
import { ISubscriptionOptions } from "./ISubscriptionOptions";

export class Bus implements IBus {
    private registeredTransports: IHashTable<IRegisteredTransport> = {};
    private registeredMessageTypes: IHashTable<IRegisteredTransport> = {};
    private messageSubscriptions: IMessageSubscription<any>[] = [];
    private messageReplyHandlers: IHashTable<ReplyHandler> = {};

    private abusGrammar = new AbusGrammar(this);

    public static instance: Bus = new Bus();
    /**
     * Makes this Bus instance globally reachable through Bus.instance.
     *
     * @memberOf Bus
     */
    public makeGlobal(): Bus {
        Bus.instance = this;
        return this;
    }

    public usingTransport(transport: IMessageTransport): TransportGrammar {
        return this.abusGrammar.usingTransport(transport);
    }

    /**
     * Makes the transport available to the bus
     * message types need to be associated with this transport for it
     * to support using the transport for sending messages. 
     *
     * @param {IMessageTransport} transport
     * @memberof Bus
     */
    public registerTransport(transport: IMessageTransport): IRegisteredTransport {
        const transportId = newGuid();
        if (this.registeredTransports[transportId]) {
            throw new Error(`A transport with the transportId: ${transportId} has already been registered.`);
        }

        const registeredTransport: IRegisteredTransport = { transportId: transportId, transport: transport, pipeline: new PipelineContext() };
        this.registeredTransports[transportId] = registeredTransport;

        // hook up the transports message receiver
        transport.onMessage((message: IMessage<any>) => {
            // process raw messages from the transport
            this.processInboundHandlers(message);
        });
        return registeredTransport;
    }

    /**
     * Configure which transport should be used for a particular message type
     *
     * @param {string} transportId
     * @param {string} messageType
     * @memberof Bus
     */
    public routeToTransport(transportId: string, messageType: string);
    public routeToTransport(transportId: string, namespace: Function);
    public routeToTransport(transportId: string, overload: any) {
        if (typeof overload !== "function") {
            this.routeToTransportByMessageType(transportId, overload);
        } else {
            throw new Error("Not supported yet");
        }
    }

    private routeToTransportByMessageType(transportId: string, messageType: string) {
        const transport = this.registeredTransports[transportId];
        if (!transport) {
            throw new Error(`TransportId ${transportId} does not exist`);
        }
        if (this.registeredMessageTypes[messageType]) {
            throw new Error(`Message type ${messageType} has already been registered`);
        }

        this.registeredMessageTypes[messageType] = transport;
    }

    public usingRegisteredTransportToMessageType(type: string): TransportGrammar {
        let transport = this.registeredMessageTypes[type];
        return new TransportGrammar(this.abusGrammar, this, transport);
    }

    public start() {
        // Verify if a default transport/message has been defined if not add one
        if (!this.registeredMessageTypes["*"]) {
            this.usingTransport(new ExpressMemoryTransport())
                .withMessageTypes("*").and
                .outboundPipeline.useLocalMessagesReceivedTasks(new MessageExceptionTask()).andAlso()
                .inboundPipeline.useLocalMessagesReceivedTasks(new MessageExceptionTask());
        }
    }

    public registerHandlers(...classHandlers: any[]): void {
        for (let i = 0; i < classHandlers.length; i++) {
            const classHandler = classHandlers[i];

            if (typeof classHandler === "object") {
                // determine if this is a single class instance with handlers or an exported object
                if (classHandler.__proto__.__messageHandlers) {
                    // class instance
                    this.registerClassHandler(classHandler.__proto__, classHandler, false);
                } else {
                    for (let key in classHandler) {
                        const handlers = classHandler[key];
                        if (typeof handlers === "function" &&
                            handlers.prototype.__messageHandlers) {
                            this.registerClassHandler(handlers.prototype, classHandler[key]);
                        }
                    }
                }
            } else {
                // Class Type
                this.registerClassHandler(classHandler.prototype, classHandler);
            }
        }
    }

    private registerClassHandler(proto: any, classHandler: any, createInstance: boolean = true) {
        // verify that the handler has used the decorator to register the handlers
        const definedHandlers = proto.__messageHandlers;
        if (!definedHandlers) {
            throw new Error("Must use @handler on method handlers to use this method.");
        }

        const subscriptions = proto.__messageHandlerSubscriptions;
        let classInstance;
        if (createInstance) {
            classInstance = new classHandler
        } else {
            classInstance = classHandler;
        }
        definedHandlers.forEach(definition => {
            const subscriptionId = this.subscribe(definition.type, classInstance[definition.handler].bind(classInstance), classInstance.constructor.name);
            // classInstance.__messageHandlersSubscriptions.push(subscriptionId);
            classInstance.__subscriptions__ = classInstance.__subscriptions__ || [];
            classInstance.__subscriptions__.push(subscriptionId);
            subscriptions.push(subscriptionId);
        });
    }

    public unregisterHandlers(...handlers: any[]): void {
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            // test if this is an instance or an export to iterate
            if ((handler as any).__subscriptions__) {
                // class instance
                (handler as any).__subscriptions__.forEach(s => {
                    this.unsubscribe(s);
                })
            }
        }
    }
    public publishAsync<T>(message: T | IMessage<T>, options?: SendOptions, parentMessage?: IMessage<any>): Promise<void> {
        message = this.convertToIMessageIfNot(message);
        const context = new MessageHandlerContext(this, parentMessage, message);
        return this.processOutboundMessageAsync(Bus.applyIntent(message as IMessage<any>, Intents.publish), context, options);
    }

    public sendWithReply<T, R>(message: T | IMessage<T>, options?: SendOptions, parentMessage?: IMessage<any>): ReplyRequest {
        message = this.convertToIMessageIfNot(message);
        let replyHandler = new ReplyHandler();
        const msg = message as IMessage<T>;
        msg.metaData = msg.metaData || {};
        msg.metaData.messageId = msg.metaData.messageId || newGuid();

        const replyHandlerPromise = new Promise((resolve, reject) => {
            replyHandler.resolve = resolve;
            replyHandler.reject = reject;
            this.messageReplyHandlers[msg.metaData.messageId] = replyHandler;
            // Add a timeout here too. This can be a default but also supplied as part of the sendOptions
        });

        // Replies dont have their message types associated with a transport. If this types reply hasn't been
        // configured, then add it to the registered types
        if (!this.registeredMessageTypes[msg.type + ".reply"]) {
            this.registeredMessageTypes[msg.type + ".reply"] = this.registeredMessageTypes[msg.type];
        }

        // Now send the message
        const context = new MessageHandlerContext(this, parentMessage, message);
        this.processOutboundMessageAsync(Bus.applyIntent(message as IMessage<any>, Intents.sendReply), context, options);
        return new ReplyRequest(replyHandler, replyHandlerPromise);
    }

    public sendAsync<T>(message: T | IMessage<T>, options?: SendOptions, parentMessage?: IMessage<any>): Promise<void> {
        message = this.convertToIMessageIfNot(message);
        const context = new MessageHandlerContext(this, parentMessage, message);

        return this.processOutboundMessageAsync(Bus.applyIntent(message as IMessage<any>, Intents.send), context, options);
    }

    public DoNotContinueDispatchingCurrentMessageToHandlers(): void {
        throw new Error("Method not implemented.");
    }

    public subscribe(filter: string, handler: IMessageHandler<any>, options?: ISubscriptionOptions): string {
        if (!filter) {
            throw new TypeError("A subscription requires a valid filter, such as a message type.");
        }

        if (typeof handler !== 'function') {
            throw new TypeError('handler must be a function');
        }

        const subscriptionId = newGuid();

        this.messageSubscriptions.push({ messageFilter: filter, handler, subscriptionId, options });
        return subscriptionId;
    }

    public unsubscribe(subscriptionId: string) {
        for (let i = 0; this.messageSubscriptions.length; i++) {
            if (this.messageSubscriptions[i].subscriptionId === subscriptionId) {
                this.messageSubscriptions.splice(i, 1);
                return;
            }
        }

        throw new Error(`No subscription with Id: ${subscriptionId} found.`);
    }

    private getTransport(messageType: string) {
        let transport = this.registeredMessageTypes[messageType];
        if (!transport) {
            transport = this.registeredMessageTypes["*"]; // Check for default
            if (!transport) {
                throw new Error(`Message type: ${messageType} has no transport defined.`);
            }
        }

        return transport;
    }

    private async processOutboundMessageAsync(message: IMessage<any>, context: IMessageHandlerContext, options: SendOptions): Promise<void> {
        // find the transport for this message
        const transport = this.getTransport(message.type);

        const handlerTask = new TransportDispatchTask(transport, options);
        const tasks = transport.pipeline.outboundStages;

        const pipelineTasks = [...tasks.logicalMessageReceived, ...tasks.transportDispatch, handlerTask];
        this.executePipelineTasks(pipelineTasks, message, context);
    }

    private async processInboundHandlers(message: IMessage<any>): Promise<void> {
        const type = message.type;
        const intent = message.metaData.intent;
        let handler: IMessageHandler<any>;

        try {
            // If this message is a reply then its for a special handler
            if (message.metaData["intent"] === Intents.reply) {
                handler = () => {
                    const replyHandler = this.messageReplyHandlers[message.metaData.replyTo];
                    if (!replyHandler.isCancelled) {
                        if (message.payload && message.payload.constructor && message.payload.constructor.name === MessageException.name) {
                            replyHandler.reject(message.payload);
                        } else {
                            replyHandler.resolve(message.payload);
                        }
                    } else {
                        replyHandler.resolve();
                    }
                    // remove handler now its been completed
                    delete this.messageReplyHandlers[message.metaData.replyTo];
                };
                await this.processInboundMessage(message, handler);
            } else {
                // Locate the handlers for the message
                // Check for exact matches
                let subscribers = this.messageSubscriptions.filter(s => s.messageFilter === type);
                if (intent === Intents.send || intent === Intents.sendReply) {
                    if (subscribers.length === 0) {
                        throw new Error(`No subscriber defined for the command ${type}`);
                    } else if (subscribers.length > 1) {
                        throw new Error(`The command ${type} must have only one subscriber.`);
                    }
                }

                if (intent === Intents.publish) {
                    // Find any other subscribers for published messages
                    subscribers = subscribers.concat(this.messageSubscriptions.filter(s => {
                        return (s.messageFilter.startsWith("*") && type.endsWith(s.messageFilter.substr(1))) ||
                            (s.messageFilter.endsWith("*") && type.startsWith(s.messageFilter.substr(0, s.messageFilter.length - 1)))
                    }));
                }
                const shouldClone = subscribers.length > 1;
                subscribers.forEach(async s => {
                    // tag message with the identifer if it exists
                    if (s.options && s.options.identifier) {
                        message.metaData.receivedBy = s.options.identifier;
                    }
                    await this.processInboundMessage(shouldClone ? this.cloneMessage(message) : message, s.handler);
                });

            }
        } catch (e) {
            // Due to the async nature of inbound messages there's no way for exceptions
            // to bubble up to the calling app. As such an error is published on the bus
            this.publishAsync({ type: MessageException.type, payload: new MessageException(e.message, e) });
        }
    }
    private cloneCount = 0;
    private cloneMessage(message: IMessage<any>): IMessage<any> {
        const copy = Object.assign({}, message);
        // Now ensure the child objects are also clones
        copy.metaData = Object.assign({}, copy.metaData);
        (copy.metaData as any).cloneCount = ++this.cloneCount;
        return copy;
    }

    private async processInboundMessage(message: IMessage<any>, handler: IMessageHandler<any>): Promise<void> {
        // find the transport for this message
        const transport = this.getTransport(message.type);
        const handlerTask = new ExecuteHandlerTask(handler);
        const tasks = transport.pipeline.inboundStages;

        const pipelineTasks = [...tasks.transportMessageReceived, ...tasks.logicalMessageReceived, ...tasks.invokeHandlers, handlerTask];
        const context = new MessageHandlerContext(this, null, message);
        this.executePipelineTasks(pipelineTasks, message, context);
    }

    private async executePipelineTasks(tasks: IMessageTask[], message: IMessage<any>, context: IMessageHandlerContext, index: number = 0) {
        let task = tasks[index];
        if (task != null) {
            await task.invokeAsync(message, context, async () => {
                if (context.shouldTerminatePipeline) {
                    // Stop the processing of the pipeline immediately.
                    return;
                }

                await this.executePipelineTasks(tasks, message, context, ++index);
            });
        }
    }

    static applyIntent(message: IMessage<any>, intent: Intents): IMessage<any> {
        if (!message.metaData) {
            message.metaData = { intent: intent };
        }

        // Only apply the intent if one doesn't already exist. Its assumed the original
        // intent was intended by the caller.
        const metaData = message.metaData;
        if (!metaData.intent) {
            metaData.intent = intent;
        }
        return message;
    }

    private convertToIMessageIfNot<T>(message: IMessage<T> | T): IMessage<T> {
        // Determine if the message passed is of IMessage
        let messageCheck = message as IMessage<T>;
        if (!messageCheck.type) {
            // This appears to be an object that is not of type IMessage
            // Synthesize an IMessage from what we know.
            let name = getTypeNamespace(message);
            if (!name || name === "String") {
                throw TypeError("You must pass either an instance of IMessage<T> or a class. You cannot pass an object literal.");
            }
            // Redefine the parameter as an IMessage
            message = { type: name, payload: message } as IMessage<T>;
        }

        return message as IMessage<T>;
    }
}