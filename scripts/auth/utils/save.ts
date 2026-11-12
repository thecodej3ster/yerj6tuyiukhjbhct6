import { Octokit } from "@octokit/rest"
import sodium from "libsodium-wrappers"

async function save({ value, name }: { value: string, name: string }) {
    const octokit = new Octokit({ auth: process.env.G_Key });

    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/');

    const { data: publicKey } = await octokit.actions.getRepoPublicKey({ owner, repo });

    await sodium.ready;
    const binkey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(value);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const encryptedValue = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    await octokit.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name: name,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
    });
}

export { save }