# Generate JWT

Once deployed and started SOAKP Server, save your OpenAI key on the server and get [JWT](https://jwt.io/introduction/) in response. It will be used for authorization to SOAKP Server in further requests. The `/get-jwt` endpoint is protected by basic HTTP Authentication so be sure to specify `AUTH_USER` and `AUTH_PASS` environment variables.

```shell
$ curl -ik -u ${AUTH_USER}:${AUTH_PASS} -X POST -H "Content-Type: application/json" -d '{"key": "
sk-YourOpenAIKey", "org": "org-UserOrg"}' https://localhost:3033/get-jwt
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 215
ETag: W/"d7-WpDvPT7Il01QhMpLkJ9heKhwSsY"
Date: Sat, 03 Jun 2023 03:52:21 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":201,"message":"JWT added","data":{"jwt":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJzay1Zb3VyT3BlbkFJS2V5IiwiaWF0IjoxNjg1NzY0MzQxLCJleHAiOjE2ODU4NTA3NDF9.8qN1OFhSZSlNfzoXd2jMD5fqQ6T69zbrXaNTWMk2XyU"}}
```

Use JWT as `Bearer` token for later authorizations without a risk of exposing your OpenAI API key.
