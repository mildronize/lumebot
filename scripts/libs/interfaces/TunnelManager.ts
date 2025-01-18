
export interface TunnelManager {
	start(): Promise<void>;

	getTunnelUrl(url: string): Promise<string>;
}
