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
.cobras-devtools {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #e0e0e0;
  z-index: 99999;
}

.cobras-devtools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #16213e;
  border-bottom: 1px solid #333;
  border-radius: 8px 8px 0 0;
}

.cobras-devtools-title {
  font-weight: 600;
  color: #fff;
}

.cobras-devtools-close {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.cobras-devtools-close:hover {
  color: #fff;
}

.cobras-devtools-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.cobras-devtools-section {
  margin-bottom: 16px;
}

.cobras-devtools-section:last-child {
  margin-bottom: 0;
}

.cobras-devtools-section h4 {
  margin: 0 0 8px 0;
  font-size: 11px;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.5px;
}

.cobras-devtools-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cobras-devtools-badge {
  background: #0f3460;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
}

.cobras-devtools-email {
  color: #888;
  font-size: 12px;
  margin-top: 4px;
}

.cobras-devtools-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.cobras-devtools-toggle input {
  cursor: pointer;
}

.cobras-devtools-flags {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cobras-devtools-flag label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.cobras-devtools-add-flag {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.cobras-devtools-add-flag input {
  flex: 1;
  background: #16213e;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px 10px;
  color: #e0e0e0;
  font-size: 12px;
}

.cobras-devtools-add-flag button {
  background: #0f3460;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  color: #fff;
  cursor: pointer;
}

.cobras-devtools-add-flag button:hover {
  background: #1a4a7a;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
