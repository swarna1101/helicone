import { AnthropicProxyHeartBeat } from "./heartbeats/anthropicProxy";
import { AsyncHeartBeat } from "./heartbeats/async";
import { FeedbackHeartBeat } from "./heartbeats/feedback";
import { GraphQLHeartBeat } from "./heartbeats/graphQL";
import { OpenAIProxyHeartBeat } from "./heartbeats/oaiProxy";
import { UsageManager } from "./managers/UsageManager";
import { PgWrapper } from "./db/PgWrapper";
import { alertSqsCongestion } from "./heartbeats/alertSqsCongestion";
import { AlertManager } from "./managers/AlertManager";

export interface Env {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  HELICONE_API_KEY: string;
  HEARTBEAT_URLS_JSON: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  STRIPE_API_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_DATEBASE_URL: string;
  SUPABASE_DATABASE_SSL: string;
  ENVIRONMENT: string;
  HYPERDRIVE: Hyperdrive;
  SLACK_WEBHOOK_URL: string;
  SENTRY_API_KEY: string;
  SENTRY_PROJECT_ID: string;
  VALHALLA_URL: string;
  HELICONE_MANUAL_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  REQUEST_LOGS_QUEUE_URL: string;
  REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY: string;
  SLACK_ALERT_CHANNEL: string;
}

const constructorMapping: Record<string, any> = {
  AsyncHeartBeat: new AsyncHeartBeat(),
  FeedbackHeartBeat: new FeedbackHeartBeat(),
  GraphQLHeartBeat: new GraphQLHeartBeat(),
  OpenAIProxyHeartBeat: new OpenAIProxyHeartBeat(),
  AnthropicProxyHeartBeat: new AnthropicProxyHeartBeat(),
};

interface HeartBeatItem {
  urls: string[];
  constructorName: string; // You can extend this interface to include any other properties as needed.
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    if (controller.cron === "* * * * *") {
      const heartBeats = JSON.parse(env.HEARTBEAT_URLS_JSON) as HeartBeatItem[];

      const heartBeatPromises = heartBeats.map(async (item) => {
        const constructor = constructorMapping[item.constructorName];
        if (!constructor) {
          console.error(`Instance for ${item.constructorName} not found.`);
          return;
        }

        const status = await constructor.beat(env);

        if (status === 200) {
          const urlPromises = item.urls.map((url) => fetch(url));
          await Promise.all(urlPromises);
        }
      });

      await Promise.all(heartBeatPromises);
      await alertSqsCongestion(env, new AlertManager(env));
    } else if (controller.cron === "0 * * * *") {
      console.log("hourly cron");
    }
  },
};
