import { CONSTANTS } from "../config/config";
import { LogoDataUrl } from "./assetList";

export const createNotification = (
  title: string,
  message: string | null,
  timeout: number = 5000
) => {
  // Check if the notification list already exists
  let notificationList = document.querySelector(
    ".bem-NotificationList.bem-NotificationList-inWorkspace"
  );

  if (!notificationList) {
    // If not, create the main notification list container
    notificationList = document.createElement("div");
    notificationList.className =
      "bem-NotificationList bem-NotificationList-inWorkspace";
    document.body.appendChild(notificationList); // Append it to the body
  }

  // Create the notification list item
  const notificationListItem =
    document.createElement("div");
  notificationListItem.className =
    "bem-NotificationList_Item";
  notificationListItem.style.transform =
    "translate3d(0px, 0px, 0px) scale(0.9)";
  notificationListItem.style.opacity = "0";

  notificationListItem.style.transition =
    "transform 0.2s ease-in-out, opacity 0.2s ease-in-out";

  setTimeout(() => {
    notificationListItem.style.transform =
      "translate3d(0px, 0px, 0px) scale(1)";
    notificationListItem.style.opacity = "1";
  }, 100);

  const removeNotification = () => {
    notificationListItem.style.transform =
      "translate3d(0px, 0px, 0px) scale(0.9)";
    notificationListItem.style.opacity = "0";
    setTimeout(() => {
      notificationListItem.remove();
    }, 200);
  };

  // Create the notification container
  const notificationContainer =
    document.createElement("div");
  notificationContainer.setAttribute(
    "data-automation-id",
    "notification-container"
  );
  notificationContainer.className =
    "bem-Notification bem-Notification-info";

  // Create the notification icon with an image
  const notificationIcon = document.createElement("div");
  notificationIcon.className = "bem-Notification_Icon";
  const iconImage = document.createElement("img");
  iconImage.src = LogoDataUrl;
  iconImage.alt = CONSTANTS.APP_NAME;
  iconImage.style.width = "24px";
  iconImage.style.height = "24px";
  iconImage.style.borderRadius = "2px";
  notificationIcon.appendChild(iconImage);

  // Create the notification body
  const notificationBody = document.createElement("div");
  notificationBody.className = "bem-Notification_Body";

  // Create the notification action (close button)
  const notificationAction = document.createElement("div");
  notificationAction.setAttribute(
    "data-automation-id",
    "notification-close-button"
  );
  notificationAction.className =
    "bem-Notification_Action wf-1rzwxxs --styled-hANylQ wf-uzc90o";
  notificationAction.innerHTML = `
  <div aria-hidden="true" class="wf-1rzwxxs --styled-cKMkJu wf-97hfmv" style="width: 16px; height: 16px;">
    <svg data-wf-icon="CloseDefaultIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.70714 8.00004L12.3536 4.35359L11.6465 3.64648L8.00004 7.29293L4.35359 3.64648L3.64648 4.35359L7.29293 8.00004L3.64648 11.6465L4.35359 12.3536L8.00004 8.70714L11.6465 12.3536L12.3536 11.6465L8.70714 8.00004Z" fill="currentColor"></path>
    </svg>
  </div>
`;

  notificationAction.addEventListener("click", () => {
    removeNotification();
  });

  // Create the notification title
  const notificationTitle = document.createElement("div");
  notificationTitle.className = "bem-Notification_Title";
  notificationTitle.textContent = title;

  // Create the notification message
  const notificationMessage = document.createElement("div");
  notificationMessage.className =
    "bem-Notification_Message";
  const messageText = document.createElement("div");
  messageText.textContent = message || "";
  notificationMessage.appendChild(messageText);

  // Assemble the notification body
  notificationBody.appendChild(notificationAction);
  notificationBody.appendChild(notificationTitle);
  if (message) {
    notificationBody.appendChild(notificationMessage);
  }

  // Assemble the notification container
  notificationContainer.appendChild(notificationIcon);
  notificationContainer.appendChild(notificationBody);

  // Assemble the notification list item
  notificationListItem.appendChild(notificationContainer);

  // Append the list item to the main notification list
  notificationList.appendChild(notificationListItem);

  if (timeout > 0) {
    setTimeout(() => {
      removeNotification();
    }, timeout);
  }
};
