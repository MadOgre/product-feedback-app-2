import http from "http";

const server = http.createServer((_, res) => {
    res.end("hello world");
});

server.listen(9001, () => console.log("server is now running"));
