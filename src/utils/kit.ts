"use client";

const KIT_API_BASE = "https://api.kit.com/v4";
const API_SECRET = import.meta.env.VITE_KIT_API_SECRET;

/**
 * Helper to make authenticated requests to Kit API
 */
async function kitRequest(endpoint: string, options: RequestInit = {}) {
  if (!API_SECRET) {
    throw new Error("Kit API Secret is missing. Please add VITE_KIT_API_SECRET to your .env file.");
  }

  const response = await fetch(`${KIT_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_SECRET}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Kit API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Finds the 'choir' tag ID or creates it if it doesn't exist
 */
export async function getOrCreateChoirTag(): Promise<string> {
  console.log("[Kit] Fetching tags...");
  const tagsData = await kitRequest("/tags");
  
  let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir");

  if (!choirTag) {
    console.log("[Kit] 'choir' tag not found. Creating it...");
    const newTagData = await kitRequest("/tags", {
      method: "POST",
      body: JSON.stringify({ name: "choir" }),
    });
    choirTag = newTagData.tag;
  }

  return choirTag.id;
}

/**
 * Adds a subscriber to a specific tag
 */
export async function addSubscriberToTag(tagId: string, email: string, firstName?: string, lastName?: string) {
  return kitRequest(`/tags/${tagId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({
      email,
      first_name: firstName || "",
      fields: {
        last_name: lastName || ""
      }
    }),
  });
}

/**
 * Syncs a list of members to Kit
 */
export async function syncMembersToKit(members: any[], onProgress?: (current: number, total: number) => void) {
  const tagId = await getOrCreateChoirTag();
  const total = members.length;
  let current = 0;

  for (const member of members) {
    if (!member.email) continue;
    
    try {
      await addSubscriberToTag(tagId, member.email, member.first_name, member.last_name);
    } catch (err) {
      console.error(`[Kit] Failed to sync ${member.email}:`, err);
    }
    
    current++;
    if (onProgress) onProgress(current, total);
    
    // Small delay to avoid rate limits if the list is long
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}