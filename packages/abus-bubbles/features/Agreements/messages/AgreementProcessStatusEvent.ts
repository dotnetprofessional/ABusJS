export class AgreementProcessStatusEvent {
    constructor(
        public operation: string,
        public status: string, public data?: object) { }
}