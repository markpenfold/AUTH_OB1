// lib/constants.ts

export const BUCKET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars`;

export const getAvatarUrl = (userId: string, hasAvatar: boolean, name: string) => {
  if (!hasAvatar) {
    console.log("no avatar")
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  }
  console.log("sending this imnage:", `${BUCKET_URL}/${userId}/avatar.png` )
  return `${BUCKET_URL}/${userId}/avatar.png`;
};