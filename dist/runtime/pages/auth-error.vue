<script setup lang="ts">
import { useRoute, useRuntimeConfig } from '#imports'

const route = useRoute()
const config = useRuntimeConfig()
const authConfig = config.public.cobrasAuth

const error = computed(() => route.query.error as string || 'Authentication Failed')
const message = computed(() => route.query.message as string || 'Unable to authenticate. Please try again.')
const redirectUri = computed(() => route.query.redirect_uri as string)

function retry() {
  if (redirectUri.value) {
    window.location.href = `${authConfig.authServiceUrl}/api/auth/authorize?redirect_uri=${encodeURIComponent(redirectUri.value)}`
  } else {
    window.location.href = '/'
  }
}
</script>

<template>
  <div class="cobras-auth-error">
    <div class="error-card">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <h1>{{ error }}</h1>
      <p>{{ message }}</p>

      <div class="actions">
        <button class="btn-primary" @click="retry">
          Try Again
        </button>
        <a href="/" class="btn-secondary">
          Go Home
        </a>
      </div>

      <p class="footer">
        If this problem persists, contact your administrator.
      </p>
    </div>
  </div>
</template>

<style scoped>
.cobras-auth-error{align-items:center;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;font-family:system-ui,-apple-system,sans-serif;justify-content:center;min-height:100vh;padding:20px}.error-card{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:420px;padding:48px 40px;text-align:center;width:100%}.error-icon{color:#dc3545;margin-bottom:24px}h1{color:#1a1a2e;font-size:24px;font-weight:600;margin:0 0 12px}p{color:#666;font-size:15px;line-height:1.6;margin:0 0 32px}.actions{display:flex;flex-direction:column;gap:12px}.btn-primary{background:#1976d2;border:none;border-radius:8px;color:#fff;cursor:pointer;display:block;font-size:16px;font-weight:600;padding:14px 24px;transition:background .2s;width:100%}.btn-primary:hover{background:#1565c0}.btn-secondary{background:#f5f5f5;border:none;border-radius:8px;color:#666;cursor:pointer;display:block;font-size:16px;font-weight:500;padding:14px 24px;text-decoration:none;transition:background .2s;width:100%}.btn-secondary:hover{background:#e8e8e8}.footer{border-top:1px solid #eee;color:#999;font-size:13px;margin-top:24px;padding-top:24px}
</style>
