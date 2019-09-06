import { IBubbleFlowResult } from '../../src/IBubbleFlowResult';

export function validateMessageTypes(messageTypes: string[], results: IBubbleFlowResult[]) {
    // ensure we have the same number of messages
    if (messageTypes.length != results.length) {
        throw new Error(`Message count mismatch: expected ${messageTypes.length} received: ${results.length}`);
    }

    for (let i = 0; i < messageTypes.length; i++) {
        const expected = messageTypes[i];
        const actual = results[i].actual.type;
        if (actual !== expected) {
            throw new Error(`Message type mismatch: expected '${expected}' received: '${actual}'`)
        }
    }
}