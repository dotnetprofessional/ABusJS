export class CancellationToken {
    private isCancelled: boolean = false;
    public get wasCancelled(): boolean {
        return this.isCancelled;
    }
    public cancel(): void {
        this.isCancelled = true;
    }
}
