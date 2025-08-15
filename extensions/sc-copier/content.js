(function() {
  const SC_REGEX = /SC-\d{6}/;

  function getDisconnectedStatus() {
    const labelCells = document.querySelectorAll('td.labelCol');

    for (const labelCell of labelCells) {
      if (labelCell.textContent.includes('Customer Service Status')) {
        const dataCell = labelCell.nextElementSibling;
        if (dataCell && dataCell.textContent.trim() === 'Disconnected') {
          return true;
        }
      }
    }
    return false;
  }

  function addCopyButtons() {
    const isDisconnected = getDisconnectedStatus();

    const labelCells = document.querySelectorAll('td.labelCol');

    labelCells.forEach(labelCell => {
      if (labelCell.textContent.includes('Service Component')) {
        const dataCell = labelCell.nextElementSibling;
        if (!dataCell) return;

        const link = dataCell.querySelector('a');
        if (!link || !SC_REGEX.test(link.textContent)) return;

        const code = link.textContent.match(SC_REGEX)[0];

        // Avoid duplicates
        if (dataCell.querySelector('.sc-copy-button')) return;

        const button = document.createElement('button');
        button.textContent = 'Copy';
        button.className = 'sc-copy-button';
        button.style.marginLeft = '8px';
        button.style.padding = '2px 6px';
        button.style.fontSize = '12px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
          const copyText = isDisconnected ? "disco'd" : code;

          navigator.clipboard.writeText(copyText).then(() => {
            button.textContent = 'Copied!';
            setTimeout(() => button.textContent = 'Copy', 1000);
          });
        });

        link.parentElement.appendChild(button);
      }
    });
  }

  // Initial run
  addCopyButtons();

  // Watch for dynamic Salesforce page changes
  const observer = new MutationObserver(addCopyButtons);
  observer.observe(document.body, { childList: true, subtree: true });
})();