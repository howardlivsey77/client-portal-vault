

# Get the FPS Edge Function Production-Ready

The `generate-fps` edge function code is complete. Here's what remains to make it deployable and callable from the frontend.

---

## Step 1: Add HMRC Secrets

The edge function requires 9 environment secrets that are not yet configured. I'll request each one from you using the secrets tool:

| Secret Name | What It Is |
|---|---|
| `HMRC_TAX_OFFICE_NUMBER` | Your 3-digit PAYE tax office number (e.g. `120`) |
| `HMRC_TAX_OFFICE_REFERENCE` | Your employer PAYE reference suffix (e.g. `BB58856`) |
| `HMRC_ACCOUNTS_OFFICE_REF` | 13-character Accounts Office Reference (e.g. `120PZ01405637`) |
| `HMRC_GATEWAY_USER_ID` | Your HMRC Government Gateway user ID |
| `HMRC_GATEWAY_PASSWORD` | Your HMRC Government Gateway password |
| `HMRC_VENDOR_ID` | Your registered HMRC software vendor ID |
| `HMRC_PRODUCT_NAME` | Product name registered with HMRC |
| `HMRC_PRODUCT_VERSION` | Product version string |
| `HMRC_LIVE_MODE` | `true` for production, `false` for HMRC test gateway |

---

## Step 2: Register in config.toml

Add the `generate-fps` entry with `verify_jwt = false` (auth is validated in code):

```toml
[functions.generate-fps]
verify_jwt = false
```

---

## Step 3: Fix CORS Headers

The current CORS headers are missing required Supabase client headers. Update to:

```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

---

## Step 4: Deploy and Test

Deploy the function and call it with a test payload to verify it works end-to-end before building any UI.

---

## Summary

No database changes needed -- `has_p45`, `p46_statement`, and the NI YTD columns are all already in place. The work is: add secrets, update config.toml, fix CORS, deploy, and test.

