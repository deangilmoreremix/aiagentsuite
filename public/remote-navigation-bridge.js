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
  
  navigateToDashboard() {
    console.log('Navigating to Dashboard');
    // Could integrate with React Router or internal navigation
    window.location.hash = '#dashboard';
  },
  
  navigateToContacts() {
    console.log('Navigating to Contacts');
    // Scroll to contacts section or navigate
    const contactsSection = document.querySelector('[data-section="contacts"]');
    if (contactsSection) {
      contactsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#contacts';
    }
  },
  
  navigateToDeals() {
    console.log('Navigating to Deals');
    const dealsSection = document.querySelector('[data-section="deals"]');
    if (dealsSection) {
      dealsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#deals';
    }
  },
  
  navigateToTasks() {
    console.log('Navigating to Tasks');
    const tasksSection = document.querySelector('[data-section="tasks"]');
    if (tasksSection) {
      tasksSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#tasks';
    }
  },
  
  navigateToCalendar() {
    console.log('Navigating to Calendar');
    const calendarSection = document.querySelector('[data-section="calendar"]');
    if (calendarSection) {
      calendarSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#calendar';
    }
  }
};

console.log('🔗 Remote Navigation Bridge loaded successfully');