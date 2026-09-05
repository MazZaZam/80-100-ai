/* eightyhundred.ai - public runtime config. The publishable key is safe to ship: row-level security is the boundary. */
window.EH_CONFIG = {
  url: "",            /* https://<ref>.supabase.co - filled in at deploy */
  key: "",            /* sb_publishable_... - filled in at deploy */
  emailLogin: false   /* magic link needs custom SMTP on Supabase; off until that exists */
};
