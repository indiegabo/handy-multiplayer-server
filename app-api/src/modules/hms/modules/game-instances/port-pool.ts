export class PortPool {
    private availablePorts: number[] = [];
    private usedPorts: Set<number> = new Set();

    constructor(startPort: number, endPort: number) {
        for (let port = startPort; port <= endPort; port++) {
            this.availablePorts.push(port);
        }
    }

    /**
     * Returns `true` if there are available ports in the pool, `false` otherwise.
     */
    get hasAvailablePorts(): boolean {
        return this.availablePorts.length > 0;
    }

    /**
     * Acquires a port from the pool.
     *
     * If there are no ports available, `null` is returned.
     *
     * @returns The port number, or `null` if no port is available.
     */
    acquire(): number | null {
        if (this.availablePorts.length === 0) {
            return null;
        }
        const port = this.availablePorts.shift()!;
        this.usedPorts.add(port);
        return port;
    }

    /**
     * Releases a port back to the pool.
     *
     * If the port is not already acquired, this method does nothing.
     *
     * @param port The port number to release.
     */
    release(port: number): void {
        if (!this.usedPorts.has(port)) return;

        this.usedPorts.delete(port);
        this.availablePorts.push(port);
        this.availablePorts.sort((a, b) => a - b);
    }
}