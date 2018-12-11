import { Bus } from "../Bus";
import { IRegisteredTransport } from "../IRegisteredTransport";
import { IMessageTransport } from "../Transports/IMessageTransport";
import { IMessageTask } from "../tasks/IMessageTask";


export class ConditionalGrammar<P> {
    constructor(protected parent: P) {

    }

    public get and(): this {
        return this;
    }

    public andAlso(): P {
        return this.parent;
    }
}

export class AbusGrammar extends ConditionalGrammar<Bus>{
    constructor(protected parent: Bus) {
        super(parent);
    }

    public useTransport(transport: IMessageTransport): TransportGrammar {
        const registeredTransport = this.parent.registerTransport(transport);

        return new TransportGrammar(this, this.parent, registeredTransport);
    }
}

export class TransportGrammar extends ConditionalGrammar<AbusGrammar>{
    constructor(protected parent: AbusGrammar, protected bus: Bus, protected transport: IRegisteredTransport) {
        super(parent);
    }

    // NOTE: Complete the fluent API for registering transports and their messages types
    //       then add additional methods to handle registering tasks
    public withMessageTypes(...types: string[] | Function[]): TransportGrammar {
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            if (typeof type === "string") {
                this.bus.routeToTransport(this.transport.transportId, type)
            } else {
                // need to support namespaces
                //TODO: Add namespace support
            }
        };

        return this;
    }

    public get inboundPipeline(): InboundTaskGrammar {
        return new InboundTaskGrammar(this, this.transport);
    }

    public get outboundPipeline(): OutboundTaskGrammar {
        return new OutboundTaskGrammar(this, this.transport);
    }
}

export class InboundTaskGrammar extends ConditionalGrammar<TransportGrammar> {
    constructor(protected parent: TransportGrammar, protected transport: IRegisteredTransport) {
        // can't pass this in constructors
        super(parent);
    }

    public useLocalMessagesReceivedTasks(task: IMessageTask) {
        this.transport.pipeline.inboundStages.logicalMessageReceived.push(task);
        return this;
    }

    public useTransportMessageReceivedTasks(task: IMessageTask) {
        this.transport.pipeline.inboundStages.transportMessageReceived.push(task);
        return this;
    }

    public useInvokeHandlersTasks(task: IMessageTask) {
        this.transport.pipeline.inboundStages.invokeHandlers.push(task);
        return this;
    }
}

export class OutboundTaskGrammar extends ConditionalGrammar<TransportGrammar> {
    constructor(protected parent: TransportGrammar, protected transport: IRegisteredTransport) {
        // can't pass this in constructors
        super(parent);
    }

    public useLocalMessagesReceivedTasks(task: IMessageTask) {
        this.transport.pipeline.outboundStages.logicalMessageReceived.push(task);
        return this;
    }

    public useTransportMessageReceivedTasks(task: IMessageTask) {
        this.transport.pipeline.outboundStages.transportDispatch.push(task);
        return this;
    }
}
