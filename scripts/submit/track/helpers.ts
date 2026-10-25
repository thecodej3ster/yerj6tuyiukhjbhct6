import fs from 'fs'

function getCampaignId() {
    interface WorkflowDispatchEvent {
        inputs: {
            campaignId: string;
        };
    }

    const eventPath = process.env.GITHUB_EVENT_PATH

    if (!eventPath) {
        throw new Error("GITHUB_EVENT_PATH environment variable is not set.");
    }

    const rawData = fs.readFileSync(eventPath, 'utf8');
    const { inputs }: WorkflowDispatchEvent = JSON.parse(rawData);
    const campaignId = inputs.campaignId

    return campaignId
}

export { getCampaignId }