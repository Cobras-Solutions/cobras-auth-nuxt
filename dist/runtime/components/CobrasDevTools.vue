<script setup lang="ts">
import { useCobrasAuth, useCobrasDevTools } from '#imports'

const { user, isAdmin } = useCobrasAuth()
const { state, isAvailable, toggle, close, setFeatureFlag, getFeatureFlag, toggleDebugMode } = useCobrasDevTools()

const featureFlagInput = ref('')

function addFeatureFlag() {
  if (featureFlagInput.value.trim()) {
    setFeatureFlag(featureFlagInput.value.trim(), true)
    featureFlagInput.value = ''
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide">
      <div
        v-if="isAvailable && state.isOpen"
        class="cobras-devtools"
      >
        <div class="cobras-devtools-header">
          <span class="cobras-devtools-title">Cobras Dev Tools</span>
          <button class="cobras-devtools-close" @click="close">&times;</button>
        </div>

        <div class="cobras-devtools-content">
          <!-- User Info -->
          <div class="cobras-devtools-section">
            <h4>User</h4>
            <div class="cobras-devtools-info">
              <span>{{ user?.name || 'Unknown' }}</span>
              <span class="cobras-devtools-badge">{{ user?.role }}</span>
            </div>
            <div class="cobras-devtools-email">{{ user?.email }}</div>
          </div>

          <!-- Debug Mode -->
          <div class="cobras-devtools-section">
            <h4>Debug</h4>
            <label class="cobras-devtools-toggle">
              <input
                type="checkbox"
                :checked="state.debugMode"
                @change="toggleDebugMode"
              />
              <span>Debug Mode</span>
            </label>
          </div>

          <!-- Feature Flags -->
          <div class="cobras-devtools-section">
            <h4>Feature Flags</h4>
            <div class="cobras-devtools-flags">
              <div
                v-for="(enabled, key) in state.featureFlags"
                :key="key"
                class="cobras-devtools-flag"
              >
                <label>
                  <input
                    type="checkbox"
                    :checked="enabled"
                    @change="setFeatureFlag(String(key), !enabled)"
                  />
                  {{ key }}
                </label>
              </div>
            </div>
            <div class="cobras-devtools-add-flag">
              <input
                v-model="featureFlagInput"
                placeholder="Add flag..."
                @keyup.enter="addFeatureFlag"
              />
              <button @click="addFeatureFlag">+</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cobras-devtools{background:#1a1a2e;border:1px solid #333;border-radius:8px;bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,.5);color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:13px;position:fixed;right:20px;width:320px;z-index:99999}.cobras-devtools-header{align-items:center;background:#16213e;border-bottom:1px solid #333;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;padding:12px 16px}.cobras-devtools-title{color:#fff;font-weight:600}.cobras-devtools-close{background:none;border:none;color:#888;cursor:pointer;font-size:20px;line-height:1;padding:0}.cobras-devtools-close:hover{color:#fff}.cobras-devtools-content{max-height:400px;overflow-y:auto;padding:16px}.cobras-devtools-section{margin-bottom:16px}.cobras-devtools-section:last-child{margin-bottom:0}.cobras-devtools-section h4{color:#888;font-size:11px;letter-spacing:.5px;margin:0 0 8px;text-transform:uppercase}.cobras-devtools-info{align-items:center;display:flex;gap:8px}.cobras-devtools-badge{background:#0f3460;border-radius:4px;font-size:11px;padding:2px 8px;text-transform:uppercase}.cobras-devtools-email{color:#888;font-size:12px;margin-top:4px}.cobras-devtools-toggle{align-items:center;cursor:pointer;display:flex;gap:8px}.cobras-devtools-toggle input{cursor:pointer}.cobras-devtools-flags{display:flex;flex-direction:column;gap:6px}.cobras-devtools-flag label{align-items:center;cursor:pointer;display:flex;gap:8px}.cobras-devtools-add-flag{display:flex;gap:8px;margin-top:8px}.cobras-devtools-add-flag input{background:#16213e;border:1px solid #333;border-radius:4px;color:#e0e0e0;flex:1;font-size:12px;padding:6px 10px}.cobras-devtools-add-flag button{background:#0f3460;border:none;border-radius:4px;color:#fff;cursor:pointer;padding:6px 12px}.cobras-devtools-add-flag button:hover{background:#1a4a7a}.slide-enter-active,.slide-leave-active{transition:all .2s ease}.slide-enter-from,.slide-leave-to{opacity:0;transform:translateY(20px)}
</style>
