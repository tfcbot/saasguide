/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities from "../activities.js";
import type * as campaignManagement from "../campaignManagement.js";
import type * as campaignMetrics from "../campaignMetrics.js";
import type * as campaignTemplates from "../campaignTemplates.js";
import type * as customers from "../customers.js";
import type * as dashboardOverview from "../dashboardOverview.js";
import type * as deals from "../deals.js";
import type * as developmentPhases from "../developmentPhases.js";
import type * as features from "../features.js";
import type * as ideaComparisons from "../ideaComparisons.js";
import type * as ideaCriteria from "../ideaCriteria.js";
import type * as ideaScores from "../ideaScores.js";
import type * as ideas from "../ideas.js";
import type * as marketingCampaigns from "../marketingCampaigns.js";
import type * as milestones from "../milestones.js";
import type * as myFunctions from "../myFunctions.js";
import type * as notifications from "../notifications.js";
import type * as projectManagement from "../projectManagement.js";
import type * as projects from "../projects.js";
import type * as roadmapManagement from "../roadmapManagement.js";
import type * as roadmaps from "../roadmaps.js";
import type * as salesActivities from "../salesActivities.js";
import type * as salesManagement from "../salesManagement.js";
import type * as seedData from "../seedData.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  campaignManagement: typeof campaignManagement;
  campaignMetrics: typeof campaignMetrics;
  campaignTemplates: typeof campaignTemplates;
  customers: typeof customers;
  dashboardOverview: typeof dashboardOverview;
  deals: typeof deals;
  developmentPhases: typeof developmentPhases;
  features: typeof features;
  ideaComparisons: typeof ideaComparisons;
  ideaCriteria: typeof ideaCriteria;
  ideaScores: typeof ideaScores;
  ideas: typeof ideas;
  marketingCampaigns: typeof marketingCampaigns;
  milestones: typeof milestones;
  myFunctions: typeof myFunctions;
  notifications: typeof notifications;
  projectManagement: typeof projectManagement;
  projects: typeof projects;
  roadmapManagement: typeof roadmapManagement;
  roadmaps: typeof roadmaps;
  salesActivities: typeof salesActivities;
  salesManagement: typeof salesManagement;
  seedData: typeof seedData;
  tasks: typeof tasks;
  users: typeof users;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
