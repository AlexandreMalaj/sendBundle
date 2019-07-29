// Require Node.js Dependencies
const { createReadStream } = require("fs");
const { resolve } = require("path");

// Require Third-party Dependencies
const TcpSdk = require("@slimio/tcp-sdk");

// CONSTANTS
const TCP_CONNECT_TIMEOUT_MS = 1000;
const fileToTransfer = [
    "Addon-alerting-1.0.0.tar",
    "Addon-gate-1.0.0.tar",
    "Addon-gate-1.0.1.tar",
    "Addon-gate-1.1.0.tar",
    "Addon-gate-1.1.2.tar",
    "Addon-socket-1.0.0.tar"
];

async function transferFile(client, fileName) {
    try {
        const id = await client.sendOne("prism.start_bundle", fileName);
        const readStream = createReadStream(resolve("archives", fileName));
        for await (const chunk of readStream) {
            await client.sendOne("prism.send_bundle", [id, chunk.toJSON()]);
        }
        const result = await client.sendOne("prism.end_bundle", id);
    }
    catch (err) {
        console.log(err);
    }
}

async function sendFiles(client) {
    console.time("transfer");
    // await Promise.all(fileToTransfer.map((file) => transferFile(client, file)));

    console.log("start !");
    const id = await client.sendOne("prism.start_bundle", "Addon-aggregator-0.1.0.tar");
    const readStream = createReadStream(resolve("archives", "Addon-aggregator-0.1.0.tar"));
    console.log("send !");
    for await (const chunk of readStream) {
        await client.sendOne("prism.send_bundle", [id, chunk.toJSON()]);
    }
    console.log("end !");
    const result = await client.sendOne("prism.end_bundle", id);

    console.timeEnd("transfer");
}

async function install(client) {
    await client.sendOne("prism.install_archive", [10, "0.1.0"]);
}

async function main() {
    // const client = new TcpSdk({ host: "79.92.140.15", port: 5002 });
    const client = new TcpSdk({ host: "localhost", port: 1337 });
    client.catch((err) => console.error(err));
    await client.once("connect", TCP_CONNECT_TIMEOUT_MS);
    console.log("connected !");

    await sendFiles(client);

    console.log("install !");
    await install(client);
    console.log("end install !");

    client.close();
    // const result = await client.sendOne("prism.receive_bundle", readStream);
    // console.log(result);
}
main().catch(console.error);
