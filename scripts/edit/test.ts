import { processCropPipeline } from './crop'
import { processPipPipeline } from './pip'
import { processHookPipeline } from './hook'
import { processTextPipeline } from './addText'
import { emptyGeminiStorage } from '../utils/helpers'
import { hash } from 'node:crypto'
import { worker } from '../utils/worker'
import { deleteSchedule } from '../publish/schedule'
import { WorkerConfig } from '../utils/types'
import path from 'path'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")
const g = [
  {
    "jobId": 8748161,
    "enabled": true,
    "title": "Post_1793268318667",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293560,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        6
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748162,
    "enabled": true,
    "title": "Post_1793268318687",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293800,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        10
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748163,
    "enabled": true,
    "title": "Post_1793268320050",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748164,
    "enabled": true,
    "title": "Post_1793268323768",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793294040,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748168,
    "enabled": true,
    "title": "Post_1793268376694",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793294160,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748169,
    "enabled": true,
    "title": "Post_1793268379266",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793294160,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748184,
    "enabled": true,
    "title": "Post_1793268558957",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293920,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        12
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748192,
    "enabled": true,
    "title": "Post_1793268616705",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293860,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748193,
    "enabled": true,
    "title": "Post_1793268619518",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793294040,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748202,
    "enabled": true,
    "title": "Post_1793268677010",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293620,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        7
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748205,
    "enabled": true,
    "title": "Post_1793268736553",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293620,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        7
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748216,
    "enabled": true,
    "title": "Post_1793268857141",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748217,
    "enabled": true,
    "title": "Post_1793268860009",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293860,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748218,
    "enabled": true,
    "title": "Post_1793268862002",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293800,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        10
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748223,
    "enabled": true,
    "title": "Post_1793268918609",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748228,
    "enabled": true,
    "title": "Post_1793268975613",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748229,
    "enabled": true,
    "title": "Post_1793268979437",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293740,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        9
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748234,
    "enabled": true,
    "title": "Post_1793269037009",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793294040,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748242,
    "enabled": true,
    "title": "Post_1793269100379",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748250,
    "enabled": true,
    "title": "Post_1793269158395",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793294160,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748253,
    "enabled": true,
    "title": "Post_1793269214978",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293920,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        12
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8748254,
    "enabled": true,
    "title": "Post_1793269220428",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 0,
    "lastDuration": 0,
    "lastExecution": 0,
    "sslCertExpiry": null,
    "nextExecution": 1793293860,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734224,
    "enabled": true,
    "title": "Post_1793105042097",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1444,
    "lastExecution": 1793250840,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337240,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734258,
    "enabled": true,
    "title": "Post_1793105284933",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1517,
    "lastExecution": 1793250960,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337360,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734312,
    "enabled": true,
    "title": "Post_1793105869198",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1850,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734387,
    "enabled": true,
    "title": "Post_1793106726324",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1688,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734424,
    "enabled": true,
    "title": "Post_1793107103611",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1400,
    "lastExecution": 1793250720,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337120,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        12
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734488,
    "enabled": true,
    "title": "Post_1793107831753",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1547,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734600,
    "enabled": true,
    "title": "Post_1793108889152",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1917,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734634,
    "enabled": true,
    "title": "Post_1793109336118",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1568,
    "lastExecution": 1793251080,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337480,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        18
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734674,
    "enabled": true,
    "title": "Post_1793109593922",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1630,
    "lastExecution": 1793250660,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337060,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8734706,
    "enabled": true,
    "title": "Post_1793109937552",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1467,
    "lastExecution": 1793250900,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337300,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        15
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738872,
    "enabled": true,
    "title": "Post_1793163918952",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1822,
    "lastExecution": 1793269020,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355420,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        17
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738873,
    "enabled": true,
    "title": "Post_1793163917438",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1999,
    "lastExecution": 1793268300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738874,
    "enabled": true,
    "title": "Post_1793163922873",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1444,
    "lastExecution": 1793268360,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354760,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        6
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738909,
    "enabled": true,
    "title": "Post_1793164276833",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1571,
    "lastExecution": 1793268600,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355000,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        10
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738916,
    "enabled": true,
    "title": "Post_1793164341021",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1447,
    "lastExecution": 1793269200,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355600,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        20
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738924,
    "enabled": true,
    "title": "Post_1793164460331",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1866,
    "lastExecution": 1793268300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738935,
    "enabled": true,
    "title": "Post_1793164523542",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1490,
    "lastExecution": 1793268900,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355300,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        15
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738943,
    "enabled": true,
    "title": "Post_1793164582820",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1609,
    "lastExecution": 1793268600,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355000,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        10
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8738958,
    "enabled": true,
    "title": "Post_1793164696198",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1589,
    "lastExecution": 1793268840,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355240,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740631,
    "enabled": true,
    "title": "Post_1793181917165",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1533,
    "lastExecution": 1793207460,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793293860,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740632,
    "enabled": true,
    "title": "Post_1793181917737",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1865,
    "lastExecution": 1793207100,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740642,
    "enabled": true,
    "title": "Post_1793181977537",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1655,
    "lastExecution": 1793207160,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793293560,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        6
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740667,
    "enabled": true,
    "title": "Post_1793182216227",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1739,
    "lastExecution": 1793207580,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793293980,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        13
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740669,
    "enabled": true,
    "title": "Post_1793182221234",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1495,
    "lastExecution": 1793207700,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793294100,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        15
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740687,
    "enabled": true,
    "title": "Post_1793182461774",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1836,
    "lastExecution": 1793207100,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793293500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740694,
    "enabled": true,
    "title": "Post_1793182515856",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1548,
    "lastExecution": 1793207940,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793294340,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        19
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740705,
    "enabled": true,
    "title": "Post_1793182652902",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1579,
    "lastExecution": 1793207220,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793293620,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        7
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8740723,
    "enabled": true,
    "title": "Post_1793182819891",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 1951,
    "lastExecution": 1793207940,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793294340,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        18
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        19
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743330,
    "enabled": true,
    "title": "Post_1793207120135",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 3282,
    "lastExecution": 1793225100,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793311500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743331,
    "enabled": true,
    "title": "Post_1793207121661",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2609,
    "lastExecution": 1793225100,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793311500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743335,
    "enabled": true,
    "title": "Post_1793207182341",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2468,
    "lastExecution": 1793225160,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793311560,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        6
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743346,
    "enabled": true,
    "title": "Post_1793207253687",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2301,
    "lastExecution": 1793225760,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793312160,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743397,
    "enabled": true,
    "title": "Post_1793207485381",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2370,
    "lastExecution": 1793225760,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793312160,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743412,
    "enabled": true,
    "title": "Post_1793207606247",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2693,
    "lastExecution": 1793225100,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793311500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743420,
    "enabled": true,
    "title": "Post_1793207745108",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2637,
    "lastExecution": 1793225100,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793311500,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743445,
    "enabled": true,
    "title": "Post_1793207956084",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2666,
    "lastExecution": 1793225640,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793312040,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8743447,
    "enabled": true,
    "title": "Post_1793207992283",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2250,
    "lastExecution": 1793225820,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793312220,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        23
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        17
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8744954,
    "enabled": true,
    "title": "Post_1793225116399",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 3202,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8744955,
    "enabled": true,
    "title": "Post_1793225117362",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2931,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8744956,
    "enabled": true,
    "title": "Post_1793225119116",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2365,
    "lastExecution": 1793250540,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336940,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        9
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8744957,
    "enabled": true,
    "title": "Post_1793225120379",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 3568,
    "lastExecution": 1793250300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8744965,
    "enabled": true,
    "title": "Post_1793225177123",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2291,
    "lastExecution": 1793250840,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337240,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8745010,
    "enabled": true,
    "title": "Post_1793225660657",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2256,
    "lastExecution": 1793250660,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337060,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8745022,
    "enabled": true,
    "title": "Post_1793225778854",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2497,
    "lastExecution": 1793250840,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793337240,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8745025,
    "enabled": true,
    "title": "Post_1793225839866",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2589,
    "lastExecution": 1793250360,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793336760,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        6
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        6
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746761,
    "enabled": true,
    "title": "Post_1793250315311",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2423,
    "lastExecution": 1793268960,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355360,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746762,
    "enabled": true,
    "title": "Post_1793250316651",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2474,
    "lastExecution": 1793268360,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354760,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        6
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746763,
    "enabled": true,
    "title": "Post_1793250318257",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2473,
    "lastExecution": 1793268720,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355120,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        12
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746764,
    "enabled": true,
    "title": "Post_1793250319365",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2594,
    "lastExecution": 1793268300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746765,
    "enabled": true,
    "title": "Post_1793250320854",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2282,
    "lastExecution": 1793268960,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355360,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        16
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746768,
    "enabled": true,
    "title": "Post_1793250380705",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2937,
    "lastExecution": 1793268601,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355000,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        10
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746783,
    "enabled": true,
    "title": "Post_1793250558810",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2681,
    "lastExecution": 1793268300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746793,
    "enabled": true,
    "title": "Post_1793250676004",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2576,
    "lastExecution": 1793269080,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355480,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        18
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746794,
    "enabled": true,
    "title": "Post_1793250677817",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2319,
    "lastExecution": 1793268840,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355240,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746800,
    "enabled": true,
    "title": "Post_1793250736479",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2428,
    "lastExecution": 1793268540,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354940,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        9
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746808,
    "enabled": true,
    "title": "Post_1793250854882",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2679,
    "lastExecution": 1793269201,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355600,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        20
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746809,
    "enabled": true,
    "title": "Post_1793250856209",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2595,
    "lastExecution": 1793268300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746810,
    "enabled": true,
    "title": "Post_1793250857082",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2486,
    "lastExecution": 1793268300,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793354700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        5
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746812,
    "enabled": true,
    "title": "Post_1793250918496",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2374,
    "lastExecution": 1793269140,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355540,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        19
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746821,
    "enabled": true,
    "title": "Post_1793250977036",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2295,
    "lastExecution": 1793268840,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355240,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        14
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8746830,
    "enabled": true,
    "title": "Post_1793251095993",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2540,
    "lastExecution": 1793268660,
    "sslCertExpiry": 1800921599,
    "nextExecution": 1793355060,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": true,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Lagos",
      "hours": [
        11
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        11
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  },
  {
    "jobId": 8667390,
    "enabled": false,
    "title": "SUBMIT",
    "saveResponses": false,
    "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Submit.yaml/dispatches",
    "lastStatus": 1,
    "lastDuration": 2808,
    "lastExecution": 1793018400,
    "sslCertExpiry": 1795823999,
    "nextExecution": 1793279700,
    "type": 0,
    "requestTimeout": 30,
    "redirectSuccess": false,
    "folderId": 0,
    "schedule": {
      "timezone": "Africa/Casablanca",
      "hours": [
        -1
      ],
      "mdays": [
        -1
      ],
      "minutes": [
        0,
        5,
        10,
        15,
        20,
        25,
        30,
        35,
        40,
        45,
        50,
        55
      ],
      "months": [
        -1
      ],
      "wdays": [
        -1
      ],
      "expiresAt": 0
    },
    "requestMethod": 1
  }
]
const r = async () => {
  for (let i = 0; i < g.length; i++) {
    const job = g[i];
    if (job.jobId !== 8667390) {
      await deleteSchedule(`${job.jobId}`)
    }
  }

  // await emptyGeminiStorage()
  // await processCropPipeline()
  // await processPipPipeline()
  // await processHookPipeline()
  // await processTextPipeline()
}

(async () => {

  await r()
  //   const e = '🤯'

  //   const svg = `<?xml version="1.0" encoding="UTF-8"?>
  // <svg width="60" height="60" viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
  //   <rect width="60" height="60" fill="none" />
  //   <style>
  //     text {
  //       font-size: 60px;
  //     }
  //   </style>
  //   <text x="20" y="60">${e}</text>
  // </svg>`


  // const {error} = await db.from('serverlists')
  //     .upsert([{ id: 'tv-xxx', data: JSON.stringify(serverList) }])
  //     .eq("id", 'tv-xxx')

  //     console.log(error);


  // const gg = path.resolve("scripts",'temp')




  // const config: WorkerConfig = { urls: { t: "https://httpbin.org/ip" }, direct: false }
  // const { t } = await worker(config)
  // console.log(t);

  // for (let i = 0; i < 5; i++) {
  //     await r()

  // }
  // const o = {
  //     keys: [
  //         "ZTdoNjkwc3ItemVxZzNicDpyc2Z2YWVnbTZq",
  //         "NDdxeHdhNTYtN3dlM3Q5ajp4ajkzcnE3ZGV2",
  //         "M2ptbTVsc3UteHpiNTZqcDphanNnY2Y4ZGht",
  //         "NnI0OGJ2MjktdjdjMjY1ZTp1bnZ4NWV6OTg2",
  //         "d3I2OGtlNnktMnhjczM2cDpkanlna3Nobjd1",
  //         "ZDd2Y2M0NnYtZ2J2dXNkZjplcnFiMnpqZGF0"
  //     ]
  // }

  //     const o = {
  //   keys: [
  //     "AQ.Ab8RN6JBLXkIdNG5UNEUZzFjD9ywYZ6bvOLxRqJoDZPaexS8zQ",
  //     'AQ.Ab8RN6KcqtK8f5pZaJjb2h3d7yJu5BDvLUXRxYN0tRGJ2oFzzQ',
  //     'AQ.Ab8RN6JqYnGOApdqW1U4Jv-oZE07d0HvHd6qqFvBm6cH1oSSCQ',
  //     'AQ.Ab8RN6IXQmX7D_6KtqDsT2vw2M4yZ_3DaO9U-IR9pBMAU3E5ag',
  //     'AQ.Ab8RN6JY2R5mnOCYIUaspfbRtY235up0jtuLNtsdCVnL6pw_Wg'
  //   ]
  // }
  //     console.log(JSON.stringify(o));

  // const fhgjhk = {
  //     vbnmn: [
  //         "ZTdoNjkwc3ItemVxZzNicDpyc2Z2YWVnbTZq",
  //         "NDdxeHdhNTYtN3dlM3Q5ajp4ajkzcnE3ZGV2",
  //         "M2ptbTVsc3UteHpiNTZqcDphanNnY2Y4ZGht",
  //         "NnI0OGJ2MjktdjdjMjY1ZTp1bnZ4NWV6OTg2",
  //         "d3I2OGtlNnktMnhjczM2cDpkanlna3Nobjd1",
  //         "ZDd2Y2M0NnYtZ2J2dXNkZjplcnFiMnpqZGF0"
  //     ]
  // }
}
)()


