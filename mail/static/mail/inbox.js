document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Themes menu
  const stylesheet = document.getElementById('theme');

  const babelsberg1 = document.getElementById('babelsberg1');
  const babelsberg2 = document.getElementById('babelsberg2');
  const babelsberg3 = document.getElementById('babelsberg3');

  babelsberg1.addEventListener('click', () => {
    stylesheet.href = 'static/mail/babelsberg1.css';
    localStorage.setItem('theme',stylesheet.href);
  });

  babelsberg2.addEventListener('click', () => {
    stylesheet.href = 'static/mail/babelsberg2.css';
    localStorage.setItem('theme',stylesheet.href);
  });

  babelsberg3.addEventListener('click', () => {
    stylesheet.href = 'static/mail/babelsberg3.css';
    localStorage.setItem('theme',stylesheet.href);
  });

});

// =============================================================== Compose email
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  navbar(false);
};

// ================================================================ Load mailbox
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#read-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML =
    `<h2 id="mailbox-title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h2>`;
  document.querySelector('#emails-view').innerHTML += `<p id="message-mailbox"></p>`;

  list_email(mailbox);

  navbar(false);
};

// ================================================================== Send email
function send_email() {
  var recipients = document.getElementById('compose-recipients').value;
  var subject = document.getElementById('compose-subject').value;
  var body = document.getElementById('compose-body').value;

  if (subject == '') {
    subject = '<i>No Subject</i>'
  }

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      var text = Object.values(result);
      var message = document.getElementById("message");
      message.innerHTML = text;

      if (Object.keys(result) == 'error') { // Display error banner
        message.classList.add('error', 'banner', 'anim-compose');
        message.style.animationPlayState ='running';
        message.style.display='block';
        message.addEventListener('animationend', () => {
          error_reset();
        })
      }
      else { // Display success banner
        message.classList.add('success', 'banner', 'anim-compose');
        message.style.animationPlayState ='running';
        message.style.display='block';
        message.addEventListener('animationend', () => {
          success_reset();
        })
      };
  });
};

// ===================================================== Send email-banner reset
// Success banner reset
function success_reset() {
  document.getElementById('message').style.display='none';
  document.getElementById('message').classList.remove('success', 'banner', 'anim-compose');
  load_mailbox('sent');
};

// Error banner reset
function error_reset() {
  document.getElementById('message').style.display='none';
  document.getElementById('message').classList.remove('error', 'banner', 'anim-compose');
};

// ====================================================== Display inbox overview
function list_email(mailbox) {

  // Remove onclick attribute from top-navbar tags
  document.getElementById("reply").onclick = null;
  document.getElementById("archive").onclick = null;
  document.getElementById("unread").onclick = null;
  document.getElementById("delete").onclick = null;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {


    for (let i = 0; i < emails.length; i++) {

      var sender = emails[i].sender;
      var subject = emails[i].subject;
      var timestamp = emails[i].timestamp;
      var read = emails[i].read;
      var archived = emails[i].archived;
      var id = emails[i].id;

      // Color of the email banner and dot if read or not read
      if (read) {
        readColor = `<div class="subjectGrid readSubject">`;
        dot = ``;
      }
      else {
        readColor = `<div class="subjectGrid unreadSubject">`;
        dot = `<span style="font-size: 9pt;">&#9679;</span>`;
      };

      // Design each of the email display (inbox and archived)
      var oneMail = `<div class="emailGrid" id="id_${id}">
        <div>${sender}</div>
        <div class="timeGrid">${timestamp}</div>
        ${readColor}
          <input type="checkbox" id="${id}" class="check" onclick="checkbox(event, this.id)">
          <p class="subject">${dot} ${subject}</p>
        </div>
      </div>`;

      // Display the list of emails
      document.querySelector('#emails-view').innerHTML += oneMail;

      // Change options display on the top navbar if archive box
      if (mailbox == 'archive') {
        document.querySelector('#archive').innerHTML = 'Remove from Archive';
      }
      else {
        document.querySelector('#archive').innerHTML = 'Move to Archive';
      }
    };

    // Clicking one email banner displays the full email
    document.querySelectorAll('.emailGrid').forEach(email => {
      email.addEventListener('click', (event) => {
        // Get id number only when calling open_email
        view_email(event.currentTarget.id.slice(3));
      })
    })

  });
};

// ================================================================== View email
function view_email(id) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Add onclick attribute to top-navbar tags
  document.getElementById("reply").onclick = () => {reply(id)};
  document.getElementById("archive").onclick = () => {archive(id)};
  document.getElementById("unread").onclick = () => {unread(id)};
  document.getElementById("delete").onclick = () => {deletemail(id)};

  document.querySelector('#read-email-view').innerHTML =
  `<h2>Read Email</h2><p id="message-read"></p>`;

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    var sender = email.sender;
    var recipients = email.recipients;
    var timestamp = email.timestamp;
    var subject = email.subject;
    var body = email.body;
    var read = email.read;
    var archived = email.archived;

    var readMail = `<div id="readEmailGrid">
      <div>From: ${sender}</div>
      <div class="timeGrid">${timestamp}</div>
      <div>To: ${recipients}</div>
      <p class="readEmailSubject">${subject}</p>
      <p class="readEmailBody">${body}</p>
    </div>`;

    document.querySelector('#read-email-view').innerHTML += readMail;
  });

  // Mark as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  navbar(true);

};

// ======================================================================= Reply
function reply(id) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    var sender = email.sender;
    var recipients = email.recipients;
    var timestamp = email.timestamp;
    var subject = email.subject;
    var body = email.body;

    // Prefill the fields
    document.querySelector('#compose-recipients').value = sender;
    document.querySelector('#compose-subject').value = `RE: ${subject}`;
    document.querySelector('#compose-body').value =
        `
___________________________________________________
On ${timestamp} ${sender} wrote:

${body}`;

  });
};
// ====================================================================== Navbar
function navbar(navbarActive = null) {

  var navlink = document.getElementsByClassName('li-top');

  if (navbarActive === null) { // Means something is checked
    // Check which mailbox
    let title = document.getElementById('mailbox-title').textContent;

    if (title === 'Sent') {
      for (var i = 0; i < navlink.length-1; i++) {
        navlink[i].classList.remove('active-navbar');
        navlink[i].classList.add('inactive-navbar');
      }
      // Activate only Delete option
      navlink[3].classList.remove('inactive-navbar');
      navlink[3].classList.add('active-navbar');
    }
    else { // Archive & Inbox
      navlink[0].classList.remove('active-navbar');
      navlink[0].classList.add('inactive-navbar');
      for (var i = 1; i < navlink.length; i++) {
        navlink[i].classList.remove('inactive-navbar');
        navlink[i].classList.add('active-navbar');
      }
    }
  }
   else if (navbarActive) { // Activate the entire navbar
    for (var i = 0; i < navlink.length; i++) {
      navlink[i].classList.remove('inactive-navbar');
      navlink[i].classList.add('active-navbar');
    }
  }
  else { // Desactivate the entire navbar
    for (var i = 0; i < navlink.length; i++) {
      navlink[i].classList.remove('active-navbar');
      navlink[i].classList.add('inactive-navbar');
    }
  }
};

// ==================================================================== Checkbox
function checkbox(event, id) {
  event.stopPropagation();

  test = document.querySelectorAll('.check:checked');
  selected = Array.from(test).map(checked => checked.id);

  if (selected.length == 0) {
    navbar(false);

    // Remove onclick attribute from top-navbar tags
    document.getElementById("reply").onclick = null;
    document.getElementById("archive").onclick = null;
    document.getElementById("unread").onclick = null;
    document.getElementById("delete").onclick = null;
  }
  else {
    navbar();

    // Add onclick attribute to top-navbar tags
    document.getElementById("reply").onclick = () => {reply()};
    document.getElementById("archive").onclick = () => {archive()};
    document.getElementById("unread").onclick = () => {unread()};
    document.getElementById("delete").onclick = () => {deletemail()};
  }
};

// ============================================================ Place to archive

function archive(id = null) {

  // Detect if element(s) should be moved or removed from archive
  var archiveTitle = document.getElementById("archive").textContent;

  // Dected the current view
  var blockList = document.querySelector('#emails-view').style.display;
  var blockRead = document.querySelector('#read-email-view').style.display;

  // If opened email from inbox
  if (archiveTitle ==='Move to Archive' && blockRead === 'block' ) {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    .then(response => {
      if (response.status == 204) {
        document.querySelector('#message-read').innerHTML = 'Email moved to Archive.';
        document.querySelector('#message-read').classList.add('success', 'banner', 'anim-read');
        setTimeout(() => load_mailbox('inbox'), 2000);
      }
      else {
        document.getElementById('#message-read').innerHTML = 'Sorry, an error occuped :(';
      }
    })
  }

  // If opened email from archived
  else if (archiveTitle ==='Remove from Archive' && blockRead === 'block' ) {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    .then(response => {
      if (response.status == 204) {
        document.querySelector('#message-read').innerHTML = 'Email removed from Archive and back to Inbox.';
        document.querySelector('#message-read').classList.add('success', 'banner', 'anim-read');
        setTimeout(() => load_mailbox('inbox'), 2000);
      }
      else {
        document.getElementById('#message-read').innerHTML = 'Sorry, an error occuped :(';
      }
    })
  }

  // If list of emails in Inbox
  else if (archiveTitle ==='Move to Archive' && blockList === 'block' ) {

    test = document.querySelectorAll('.check:checked');
    selected = Array.from(test).map(checked => checked.id); // Array of ids

    for (let i = 0; i < selected.length; i++) {
      // Set archive to true
      fetch(`/emails/${selected[i]}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      .then(response => {
        if (response.status == 204) {
          // Remove mails from the list
          var thisemail = document.getElementById(`id_${selected[i]}`);
          thisemail.classList.add('hide');
          thisemail.style.animationPlayState ='running';
          thisemail.addEventListener('animationend', () => {
            thisemail.remove();
          })
        };
      });
    }
  }

  // If list of emails in Archived
  else if (archiveTitle ==='Remove from Archive' && blockList === 'block' ) {

    test = document.querySelectorAll('.check:checked');
    selected = Array.from(test).map(checked => checked.id); // Array of ids

    for (let i = 0; i < selected.length; i++) {
      // Set archive to false
      fetch(`/emails/${selected[i]}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      .then(response => {
        if (response.status == 204) {
          // Remove mails from the list
          var thisemail = document.getElementById(`id_${selected[i]}`);
          thisemail.classList.add('hide');
          thisemail.style.animationPlayState ='running';
          thisemail.addEventListener('animationend', () => {
            thisemail.remove();
          })
        };
      });
    }
  }
};

// ============================================================== Make as unread
function unread(id = null) {

  // Detect if element(s) should be moved or removed from archive
  var archiveTitle = document.getElementById("archive").textContent;

  // Dected the current view
  var blockList = document.querySelector('#emails-view').style.display;
  var blockRead = document.querySelector('#read-email-view').style.display;

  if (blockRead === 'block' ) { // If opened email
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: false
      })
    })
    .then(response => {
      if (response.status == 204) {
        document.getElementById('message-read').innerHTML = 'Email marked as unread.';
        document.getElementById('message-read').classList.add('success', 'banner', 'anim-read');
      }
      else {
        document.getElementById('message-read').innerHTML = 'Sorry, an error occuped :(';
        document.getElementById('message-read').classList.add('error', 'banner', 'anim-read');
      }
    })
  }
  else if (blockList === 'block' ) { // If list of emails

    test = document.querySelectorAll('.check:checked');
    selected = Array.from(test).map(checked => checked.id); // Array of ids

    for (let i = 0; i < selected.length; i++) {
      fetch(`/emails/${selected[i]}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: false
        })
      })
    }
    if (archiveTitle ==='Move to Archive') { // If Inbox
      setTimeout(() => load_mailbox('inbox'), 500);
    }
    else { // If Archive
      setTimeout(() => load_mailbox('archive'), 500);
    }
  }
};

// ================================================================ Delete email
function deletemail(id = null) {

  // Dected the current view
  var blockList = document.querySelector('#emails-view').style.display;
  var blockRead = document.querySelector('#read-email-view').style.display;

  if (blockRead === 'block' ) { // If opened email
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        delete: true
      })
    })
    .then(response => {
      if (response.status == 204) {
        document.getElementById('message-read').innerHTML = 'Email deleted.';
        document.getElementById('message-read').classList.add('success', 'banner', 'anim-read');
        setTimeout(() => load_mailbox('inbox'), 2000);
      }
      else {
        document.getElementById('message-read').innerHTML = 'Sorry, an error occuped :(';
      }
    })
  }
  else if (blockList === 'block' ) { // If list of emails

    test = document.querySelectorAll('.check:checked');
    selected = Array.from(test).map(checked => checked.id); // Array of ids

    for (let i = 0; i < selected.length; i++) {
      fetch(`/emails/${selected[i]}`, {
        method: 'PUT',
        body: JSON.stringify({
          delete: true
        })
      })
      .then(response => {
        if (response.status == 204) {
          // Remove mails from the list
          var thisemail = document.getElementById(`id_${selected[i]}`);
          thisemail.classList.add('hide');
          thisemail.style.animationPlayState ='running';
          thisemail.addEventListener('animationend', () => {
            thisemail.remove();
          })
        };
      });
    }
  }
};
