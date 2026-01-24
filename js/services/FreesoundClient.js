// Freesound API Client
export class FreesoundClient {
    constructor() {
        this.apiKey = "4DbvH6l42zd0JLdxwvSmGiS7UsCz4Qy1QzbvvTVQ"; // API Key will be provided by environment or user input
        this.baseUrl = "https://freesound.org/apiv2";
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    async textSearch(query, filter = "", sort = "rating_desc") {
        if (!this.apiKey) throw new Error("API Key not set");
        
        // Construct URL with query parameters
        const url = new URL(`${this.baseUrl}/search/text/`);
        url.searchParams.append("query", query);
        if (filter) url.searchParams.append("filter", filter);
        url.searchParams.append("sort", sort);
        url.searchParams.append("fields", "id,name,previews,analysis,tags,username,duration,license");
        url.searchParams.append("token", this.apiKey);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Freesound API Error: ${response.statusText}`);
        return await response.json();
    }

    async getSound(soundId) {
        if (!this.apiKey) throw new Error("API Key not set");
        const url = `${this.baseUrl}/sounds/${soundId}/?token=${this.apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Freesound API Error: ${response.statusText}`);
        return await response.json();
    }

    async getSimilarSounds(soundId) {
        if (!this.apiKey) throw new Error("API Key not set");
        const url = `${this.baseUrl}/sounds/${soundId}/similar/?token=${this.apiKey}&fields=id,name,previews,duration`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Freesound API Error: ${response.statusText}`);
        return await response.json();
    }
}