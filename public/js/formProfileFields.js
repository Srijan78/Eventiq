/**
 * @fileoverview Profile-specific dynamic form field manipulation and extraction.
 */

/**
 * Toggles visibility of dynamic event-specific fieldsets.
 * @param {string} eventType
 * @param {HTMLFormElement} form
 */
export function updateDynamicFields(eventType, form) {
  const weddingFields = form.querySelector('#fields-wedding');
  const birthdayFields = form.querySelector('#fields-birthday');
  const communityFields = form.querySelector('#fields-community');
  const otherFields = form.querySelector('#fields-other');

  if (weddingFields) {
    weddingFields.hidden = eventType !== 'wedding';
  }
  if (birthdayFields) {
    birthdayFields.hidden = eventType !== 'birthday';
  }
  if (communityFields) {
    communityFields.hidden = eventType !== 'community';
  }
  if (otherFields) {
    otherFields.hidden = eventType !== 'other';
    const eventNameInput = form.querySelector('#field-event-name');
    if (eventNameInput) {
      eventNameInput.required = eventType === 'other';
    }
  }
}

/**
 * Extracts specific profile-driven fields from form.
 *
 * @param {string} eventType
 * @param {FormData} formData
 * @returns {object}
 */
export function extractProfileSpecificData(eventType, formData) {
  if (eventType === 'wedding') {
    return {
      wedding: {
        functions: formData.getAll('weddingFunctions').map(String),
        indoor: formData.get('weddingIndoor') !== 'false',
        dietary: String(formData.get('weddingDietary') || '').trim(),
      },
    };
  }
  if (eventType === 'birthday') {
    const ageRaw = formData.get('birthdayAge');
    return {
      birthday: {
        age: ageRaw ? parseInt(String(ageRaw), 10) : undefined,
        surprise: formData.get('birthdaySurprise') === 'true',
        indoor: formData.get('birthdayIndoor') !== 'false',
      },
    };
  }
  if (eventType === 'community') {
    const crowdRaw = formData.get('communityCrowd');
    const sponsorRaw = formData.get('communitySponsorship');
    return {
      community: {
        expectedCrowd: crowdRaw ? parseInt(String(crowdRaw), 10) : undefined,
        sponsorshipTarget: sponsorRaw ? parseInt(String(sponsorRaw), 10) : 0,
        indoor: formData.get('communityIndoor') === 'true',
        isPublic: formData.get('communityPublic') !== 'false',
      },
    };
  }
  return {};
}

/**
 * Populates wedding fields in form.
 * @param {HTMLFormElement} form
 * @param {object} wedding
 * @param {(id: string, val: any) => void} setVal
 */
function populateWeddingFields(form, wedding, setVal) {
  const fns = wedding.functions || [];
  const fnBoxes = form.querySelectorAll('input[name="weddingFunctions"]');
  for (const b of fnBoxes) {
    b.checked = fns.includes(b.value);
  }
  setVal('#field-wedding-dietary', wedding.dietary);
  const indoorSelect = form.querySelector('#field-wedding-indoor');
  if (indoorSelect) {
    indoorSelect.value = wedding.indoor ? 'true' : 'false';
  }
}

/**
 * Populates profile-specific fields from saved request.
 *
 * @param {HTMLFormElement} form
 * @param {object} req
 * @param {(id: string, val: any) => void} setVal
 */
export function populateProfileFields(form, req, setVal) {
  if (req.wedding) {
    populateWeddingFields(form, req.wedding, setVal);
  }
  if (req.birthday) {
    setVal('#field-birthday-age', req.birthday.age);
    const surpriseSelect = form.querySelector('#field-birthday-surprise');
    if (surpriseSelect) {
      surpriseSelect.value = req.birthday.surprise ? 'true' : 'false';
    }
  }
  if (req.community) {
    setVal('#field-community-crowd', req.community.expectedCrowd);
    setVal('#field-community-sponsorship', req.community.sponsorshipTarget);
  }
}
