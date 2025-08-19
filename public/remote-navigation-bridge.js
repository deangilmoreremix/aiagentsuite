// App detection function
function getAppName() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('moonlit-tarsier')) {
    return 'white-label-suite';
  } else if (hostname.includes('clever-syrniki')) {
    return 'product-research';
  } else if (hostname.includes('resilient-frangipane')) {
    return 'ai-analytics';
  } else if (hostname.includes('tubular-choux')) {
    return 'smartcrm-ai-suite';
  }
  // Default fallback
  return 'smartcrm-ai-suite';
}

// Remote Navigation Bridge for CRM Integration
window.remoteBridge = {
  getAppName,
};

console.log('🔗 Remote Navigation Bridge loaded successfully');