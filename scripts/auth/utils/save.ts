import { Octokit } from "@octokit/rest"
import sodium from "libsodium-wrappers"

async function save({ value, name }: { value: string, name: string }) {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/');
    const environmentName = process.env.Environment!

    const { data: publicKey } = await octokit.request(
        'GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key',
        {
            owner,
            repo,
            environment_name: environmentName
        }
    );

    await sodium.ready;
    const binkey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(value);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const encryptedValue = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    await octokit.request(
        'PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}',
        {
            owner,
            repo,
            environment_name: environmentName,
            secret_name: name,
            encrypted_value: encryptedValue,
            key_id: publicKey.key_id
        }
    );
}


export { save }