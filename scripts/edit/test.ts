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
const g = {
  "jobs": [
    {
      "jobId": 8733346,
      "enabled": true,
      "title": "Post_1793096061113",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 0,
      "lastDuration": 0,
      "lastExecution": 0,
      "sslCertExpiry": null,
      "nextExecution": 1793120940,
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
      "jobId": 8733355,
      "enabled": true,
      "title": "Post_1793096128307",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 0,
      "lastDuration": 0,
      "lastExecution": 0,
      "sslCertExpiry": null,
      "nextExecution": 1793120700,
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
      "jobId": 8723017,
      "enabled": true,
      "title": "Post_1792972805253",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2620,
      "lastExecution": 1793052301,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138700,
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
      "jobId": 8723018,
      "enabled": true,
      "title": "Post_1792972807091",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 3177,
      "lastExecution": 1793052360,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138760,
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
      "jobId": 8723019,
      "enabled": true,
      "title": "Post_1792972808541",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 3082,
      "lastExecution": 1793052301,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138700,
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
      "jobId": 8723020,
      "enabled": true,
      "title": "Post_1792972809905",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2742,
      "lastExecution": 1793052960,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139360,
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
      "jobId": 8723021,
      "enabled": true,
      "title": "Post_1792972811127",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2628,
      "lastExecution": 1793052902,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139300,
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
      "jobId": 8723040,
      "enabled": true,
      "title": "Post_1792972992941",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2498,
      "lastExecution": 1793052301,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138700,
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
      "jobId": 8723041,
      "enabled": true,
      "title": "Post_1792972995293",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2800,
      "lastExecution": 1793052602,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139000,
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
      "jobId": 8723042,
      "enabled": true,
      "title": "Post_1792972997609",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2573,
      "lastExecution": 1793053140,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139540,
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
      "jobId": 8723044,
      "enabled": true,
      "title": "Post_1792972998711",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2481,
      "lastExecution": 1793052902,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139300,
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
      "jobId": 8723045,
      "enabled": true,
      "title": "Post_1792973000871",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2851,
      "lastExecution": 1793052301,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138700,
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
      "jobId": 8727449,
      "enabled": true,
      "title": "Post_1793018792573",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1429,
      "lastExecution": 1793052660,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139060,
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
      "jobId": 8727450,
      "enabled": true,
      "title": "Post_1793018795475",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1675,
      "lastExecution": 1793052420,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138820,
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
      "jobId": 8727451,
      "enabled": true,
      "title": "Post_1793018798767",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1592,
      "lastExecution": 1793052660,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139060,
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
      "jobId": 8727452,
      "enabled": true,
      "title": "Post_1793018800244",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1505,
      "lastExecution": 1793052720,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793139120,
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
      "jobId": 8727453,
      "enabled": true,
      "title": "Post_1793018801885",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1485,
      "lastExecution": 1793052300,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793138700,
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
      "jobId": 8727475,
      "enabled": true,
      "title": "Post_1793019109927",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1633,
      "lastExecution": 1793078160,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164560,
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
      "jobId": 8727522,
      "enabled": true,
      "title": "Post_1793019507005",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1464,
      "lastExecution": 1793077500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793163900,
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
      "jobId": 8727596,
      "enabled": true,
      "title": "Post_1793020213257",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1520,
      "lastExecution": 1793078340,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164740,
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
      "jobId": 8727628,
      "enabled": true,
      "title": "Post_1793020541342",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1473,
      "lastExecution": 1793077500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793163900,
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
      "jobId": 8728913,
      "enabled": true,
      "title": "Post_1793032968902",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1419,
      "lastExecution": 1793078100,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164500,
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
      "jobId": 8729094,
      "enabled": true,
      "title": "Post_1793034813271",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1763,
      "lastExecution": 1793077980,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164380,
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
      "jobId": 8729123,
      "enabled": true,
      "title": "Post_1793035206748",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1400,
      "lastExecution": 1793078100,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164500,
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
      "jobId": 8729150,
      "enabled": true,
      "title": "Post_1793035471528",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1383,
      "lastExecution": 1793078280,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164680,
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
      "jobId": 8730634,
      "enabled": true,
      "title": "Post_1793052314383",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2383,
      "lastExecution": 1793077920,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164320,
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
      "jobId": 8730635,
      "enabled": true,
      "title": "Post_1793052319942",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2408,
      "lastExecution": 1793078040,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164440,
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
      "jobId": 8730636,
      "enabled": true,
      "title": "Post_1793052323604",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2455,
      "lastExecution": 1793077801,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164200,
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
      "jobId": 8730638,
      "enabled": true,
      "title": "Post_1793052326343",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2496,
      "lastExecution": 1793078280,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164680,
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
      "jobId": 8730639,
      "enabled": true,
      "title": "Post_1793052327524",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2643,
      "lastExecution": 1793077801,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164200,
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
      "jobId": 8730645,
      "enabled": true,
      "title": "Post_1793052376489",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2256,
      "lastExecution": 1793077560,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793163960,
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
      "jobId": 8730648,
      "enabled": true,
      "title": "Post_1793052445095",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2317,
      "lastExecution": 1793078340,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164740,
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
      "jobId": 8730658,
      "enabled": true,
      "title": "Post_1793052622509",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2334,
      "lastExecution": 1793077740,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164140,
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
      "jobId": 8730660,
      "enabled": true,
      "title": "Post_1793052677917",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2277,
      "lastExecution": 1793078040,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164440,
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
      "jobId": 8730661,
      "enabled": true,
      "title": "Post_1793052680501",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2651,
      "lastExecution": 1793078040,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164440,
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
      "jobId": 8730664,
      "enabled": true,
      "title": "Post_1793052736286",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2242,
      "lastExecution": 1793077860,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164260,
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
      "jobId": 8730676,
      "enabled": true,
      "title": "Post_1793052920022",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2453,
      "lastExecution": 1793077560,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793163960,
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
      "jobId": 8730677,
      "enabled": true,
      "title": "Post_1793052920041",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2384,
      "lastExecution": 1793077500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793163900,
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
      "jobId": 8730685,
      "enabled": true,
      "title": "Post_1793052979706",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2405,
      "lastExecution": 1793078101,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164500,
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
      "jobId": 8730692,
      "enabled": true,
      "title": "Post_1793053158789",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2181,
      "lastExecution": 1793077980,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793164380,
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
      "jobId": 8731929,
      "enabled": true,
      "title": "Post_1793077517225",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2037,
      "lastExecution": 1793095500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181900,
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
      "jobId": 8731930,
      "enabled": true,
      "title": "Post_1793077522846",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1828,
      "lastExecution": 1793095500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181900,
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
      "jobId": 8731933,
      "enabled": true,
      "title": "Post_1793077578611",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 2129,
      "lastExecution": 1793095500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181900,
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
      "jobId": 8731937,
      "enabled": true,
      "title": "Post_1793077757322",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1387,
      "lastExecution": 1793096040,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182440,
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
      "jobId": 8731940,
      "enabled": true,
      "title": "Post_1793077818467",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1497,
      "lastExecution": 1793095740,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182140,
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
      "jobId": 8731941,
      "enabled": true,
      "title": "Post_1793077821621",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1380,
      "lastExecution": 1793095680,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182080,
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
          8
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
      "jobId": 8731945,
      "enabled": true,
      "title": "Post_1793077874359",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1289,
      "lastExecution": 1793095800,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182200,
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
      "jobId": 8731948,
      "enabled": true,
      "title": "Post_1793077936342",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1916,
      "lastExecution": 1793095800,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182200,
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
      "jobId": 8731949,
      "enabled": true,
      "title": "Post_1793077997455",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1556,
      "lastExecution": 1793095560,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181960,
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
      "jobId": 8731951,
      "enabled": true,
      "title": "Post_1793078007362",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1633,
      "lastExecution": 1793096040,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182440,
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
      "jobId": 8731959,
      "enabled": true,
      "title": "Post_1793078058930",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1569,
      "lastExecution": 1793095560,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181960,
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
      "jobId": 8731964,
      "enabled": true,
      "title": "Post_1793078117057",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1664,
      "lastExecution": 1793095920,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182320,
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
      "jobId": 8731965,
      "enabled": true,
      "title": "Post_1793078120515",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1541,
      "lastExecution": 1793095500,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181900,
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
      "jobId": 8731969,
      "enabled": true,
      "title": "Post_1793078179800",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1654,
      "lastExecution": 1793095560,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793181960,
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
      "jobId": 8731977,
      "enabled": true,
      "title": "Post_1793078299886",
      "saveResponses": false,
      "url": "https://api.github.com/repos/thecodej3ster/yerj6tuyiukhjbhct6/actions/workflows/Clip.yaml/dispatches",
      "lastStatus": 1,
      "lastDuration": 1520,
      "lastExecution": 1793095860,
      "sslCertExpiry": 1795823999,
      "nextExecution": 1793182260,
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
      "nextExecution": 1793096700,
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
  ],
  "someFailed": false
}
const r = async () => {
  for (let i = 0; i < g.jobs.length; i++) {
    const job = g.jobs[i];
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


