export class PortPool {
    private availablePorts: number[] = [];
    private usedPorts: Set<number> = new Set();

    constructor(startPort: number, endPort: number) {
        for (let port = startPort; port <= endPort; port++) {
            this.availablePorts.push(port);
        }
    }
    get hasAvailablePorts(): boolean {
        return this.availablePorts.length > 0;
    }

    acquire(): number | null {
        if (this.availablePorts.length === 0) {
            return null;
        }
        const port = this.availablePorts.shift()!;
        this.usedPorts.add(port);
        return port;
    }

    release(port: number): void {
        if (!this.usedPorts.has(port)) return;

        this.usedPorts.delete(port);
        this.availablePorts.push(port);
        this.availablePorts.sort((a, b) => a - b);
    }
}