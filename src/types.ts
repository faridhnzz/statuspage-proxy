export interface apiStatus {
	page: {
		id: string;
		name: string;
		url: string | URL;
		time_zone: string;
		updated_at: string;
	};
	status: {
		indicator: string;
		description: string;
	};
}
