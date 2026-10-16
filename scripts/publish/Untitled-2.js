fetch("https://api.cron-job.org/", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE4NTYwOTEsInN1YiI6ODQ0Mzk2LCJzY3AiOiJzZXNzaW9uIn0._6eOpYB9ziBzlgonYDWI2hRUgUdsnHymKvxiatgqkSY",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "x-api-method": "CreateJob",
    "x-ui-language": "en",
    "cookie": "refreshToken=3HJtC4hvwVn9KdOTSt9jN6dengGEprxoUK7QbALQnrz7VNIYTk7a0qZgBmCZY6qc",
    "Referer": "https://console.cron-job.org/"
  },
  "body": "{\"job\":{\"title\":\"CLIP FARM PROXY UPDATE\",\"url\":\"https://clipfarm-frt35502k-jess-a587.vercel.app/api/proxy/update\",\"enabled\":true,\"saveResponses\":false,\"requestTimeout\":30,\"redirectSuccess\":false,\"auth\":{\"enable\":false,\"user\":\"\",\"password\":\"\"},\"notification\":{\"onSslCertExpiry\":false,\"onSslCertExpirySeconds\":604800,\"onSuccess\":false,\"onDisable\":true,\"onFailure\":false,\"onFailureCount\":1,\"mode\":1,\"selectedChannels\":[]},\"requestMethod\":0,\"extendedData\":{\"body\":\"\",\"headers\":{}},\"schedule\":{\"mdays\":[-1],\"wdays\":[-1],\"months\":[-1],\"hours\":[23],\"minutes\":[59],\"expiresAt\":0,\"timezone\":\"Africa/Casablanca\"},\"folderId\":0}}",
  "method": "POST"
});


curl 'https://api.cron-job.org/' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-US,en;q=0.8' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE4NTYwOTEsInN1YiI6ODQ0Mzk2LCJzY3AiOiJzZXNzaW9uIn0._6eOpYB9ziBzlgonYDWI2hRUgUdsnHymKvxiatgqkSY' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -b 'refreshToken=3HJtC4hvwVn9KdOTSt9jN6dengGEprxoUK7QbALQnrz7VNIYTk7a0qZgBmCZY6qc' \
  -H 'Origin: https://console.cron-job.org' \
  -H 'Pragma: no-cache' \
  -H 'Referer: https://console.cron-job.org/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'Sec-GPC: 1' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \
  -H 'X-API-Method: CreateJob' \
  -H 'X-UI-Language: en' \
  -H 'sec-ch-ua: "Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  --data-raw '{"job":{"title":"CLIP FARM PROXY UPDATE","url":"https://clipfarm-frt35502k-jess-a587.vercel.app/api/proxy/update","enabled":true,"saveResponses":false,"requestTimeout":30,"redirectSuccess":false,"auth":{"enable":false,"user":"","password":""},"notification":{"onSslCertExpiry":false,"onSslCertExpirySeconds":604800,"onSuccess":false,"onDisable":true,"onFailure":false,"onFailureCount":1,"mode":1,"selectedChannels":[]},"requestMethod":0,"extendedData":{"body":"","headers":{}},"schedule":{"mdays":[-1],"wdays":[-1],"months":[-1],"hours":[23],"minutes":[59],"expiresAt":0,"timezone":"Africa/Casablanca"},"folderId":0}}'















  fetch("https://api.cron-job.org/", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE4NTY2OTIsInN1YiI6ODQ0Mzk2LCJzY3AiOiJzZXNzaW9uIn0.3XJODyVo7-2jc8JjCS6QYdmsHcDsMOayxSfM1b32fS0",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "x-api-method": "DeleteJob",
    "x-ui-language": "en",
    "cookie": "refreshToken=3HJtC4hvwVn9KdOTSt9jN6dengGEprxoUK7QbALQnrz7VNIYTk7a0qZgBmCZY6qc",
    "Referer": "https://console.cron-job.org/"
  },
  "body": "{\"jobId\":8633977}",
  "method": "POST"
});

















curl 'https://api.cron-job.org/' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-US,en;q=0.8' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE4NTY2OTIsInN1YiI6ODQ0Mzk2LCJzY3AiOiJzZXNzaW9uIn0.3XJODyVo7-2jc8JjCS6QYdmsHcDsMOayxSfM1b32fS0' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -b 'refreshToken=3HJtC4hvwVn9KdOTSt9jN6dengGEprxoUK7QbALQnrz7VNIYTk7a0qZgBmCZY6qc' \
  -H 'Origin: https://console.cron-job.org' \
  -H 'Pragma: no-cache' \
  -H 'Referer: https://console.cron-job.org/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'Sec-GPC: 1' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \
  -H 'X-API-Method: DeleteJob' \
  -H 'X-UI-Language: en' \
  -H 'sec-ch-ua: "Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  --data-raw '{"jobId":8634014}'