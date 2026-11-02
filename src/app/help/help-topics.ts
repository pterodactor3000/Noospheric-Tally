interface HelpScreenshotImage {
  readonly fileName: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

interface HelpTopic {
  readonly id: string
  readonly title: string
  readonly paragraphs: readonly string[]
  readonly screenshots: readonly HelpScreenshotImage[]
}

const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: 'hab-unit-creation',
    title: 'Hab-unit data creation',
    paragraphs: [
      'A new account opens Hab-unit data creation before it has a tally.',
      'Join hab-unit is for an invite. If you received an invite code, you can join an existing hab-unit here. Type the code in Invite code and press Join.',
      'Create hab-unit is for a tally of your own. You can create your own hab-unit tally. You can share it later. The name goes in Hab-unit designation. Press Apply.',
    ],
    screenshots: [
      {
        fileName: 'help-01-hab-unit.png',
        alt: 'Hab-unit data creation in dark mode, with Join hab-unit above Create hab-unit.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'tally-list',
    title: 'The tally list',
    paragraphs: [
      'The tally lists every item in the hab unit. Each row shows the name, a dot leader, [-], the count, and [+]. The heading is [<hab unit name>] tally.',
      'Items sit in Pet food, Food, Beauty, Other, then Uncategorized. A category header shows how many items it holds.',
      '[-] lowers the count by 1. [+] raises it by 1. The tally saves that change at once. [-] is disabled at 0. [+] is disabled at 99.',
      'The row is green for IN STOCK, yellow for WARNING, and red for CRITICAL. Tap a name to open that item.',
      'A category with a WARNING or CRITICAL item uses that color and opens on its own. The other categories stay closed until you tap them.',
    ],
    screenshots: [
      {
        fileName: 'help-02-tally.png',
        alt: 'Tally list in dark mode with Pet food, Food, and Other open.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'search-sort-categories',
    title: 'Search, sort, and categories',
    paragraphs: [
      'Search by name keeps rows whose name contains what you type, and it ignores case. It opens the categories that still have rows. If nothing matches, the page says so.',
      'The list starts A to Z. The name button switches it to Z to A, then back to A to Z. The count button sorts from low to high, then high to low. Items at 0 stay last.',
      'The layers button is labelled Group by category. It switches between category panels and one flat list. It stays disabled while a count change is saving.',
      'The search field appears once the hab unit holds an item.',
    ],
    screenshots: [
      {
        fileName: 'help-03-search-sort.png',
        alt: 'Tally search in dark mode for rice, sorted by count, with grouping off.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'add-items',
    title: 'Add items below the tally',
    paragraphs: [
      'The controls under the tally are Add item, Scan item, Restock, Lookup, and the link Share hab unit.',
      'Add item opens Item data creation. Type 6 to 14 digits in Barcode and press Apply. Six digits are read as UPC-E. Seven digits are read as UPC-E when they start with 0 or 1. A seven-digit code that starts with another digit is rejected. Lengths 8, 12, 13, and 14 need a valid check digit. Other lengths, such as 11, have none.',
      'For an item with no barcode, use Or add an item without a barcode, enter an Item name of 1 to 120 characters, and press Add without barcode. That path is for spices and loose goods.',
      'For many items, use Or add many items from a JSON file, choose JSON file, and press Add items from file. The file is a JSON array of objects with name and barcode, at most 500 items and 256KB. Barcodes must be valid and must not repeat. If one entry is wrong, the message names that entry and the app adds nothing. A barcode that already exists says entries[<index>] uses barcode <barcode>, which already exists.',
      'A barcode already in the hab unit shows Already stocked. A barcode known from another hab unit shows Add to hab-unit with the saved name and Apply. A new item starts at count 1 and minimum 3.',
    ],
    screenshots: [
      {
        fileName: 'help-04-add-item.png',
        alt: 'Item data creation in dark mode with the name and JSON sections open.',
        width: 390,
        height: 948,
      },
    ],
  },
  {
    id: 'unknown-barcode-and-attach',
    title: 'Items missing from the database, and extra barcodes',
    paragraphs: [
      'A barcode the app has never seen opens Item data creation for that barcode. The page says The item was not found in our database.',
      'Open Food Facts, Open Beauty Facts, Open Pet Food Facts, or Open Products Facts prefill Item name when one of them knows the barcode. When none does, the page adds Enter the item name manually.',
      'Type or fix Item name and press Apply.',
      'Attach to existing item opens Filter and the Item designation list. Pick the item and press Attach. The new barcode joins that item, so both barcodes find it. This section shows only when the hab unit already has an item.',
    ],
    screenshots: [
      {
        fileName: 'help-05-unknown-barcode.png',
        alt: 'Item data creation in dark mode for a barcode the hab-unit does not hold, with a prefilled name.',
        width: 390,
        height: 844,
      },
      {
        fileName: 'help-05-attach-existing.png',
        alt: 'Attach to existing item in dark mode with Basmati rice selected.',
        width: 390,
        height: 1182,
      },
    ],
  },
  {
    id: 'scanner',
    title: 'The scanner',
    paragraphs: [
      'Scan item opens the camera inside a frame. Two buttons sit on that frame. consume is the default. tally is the other.',
      'The selected button is filled, and its name sits above the buttons in brackets, for example [consume]. consume lowers the scanned item\'s count by 1. tally raises it by 1. The browser session keeps that choice.',
      'A barcode this hab unit does not hold opens Item data creation. If the camera cannot start, the screen says Pict servitor failed. Perform appeasing rituals to calm machine spirit. Provide input manually. A Barcode field is there. Type the digits and press Apply.',
      'Scans from this session are listed under the camera as +1 or -1. Undo reverses one line.',
    ],
    screenshots: [
      {
        fileName: 'help-06-scanner.png',
        alt: 'Scanner in dark mode with consume selected and manual barcode entry.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'scan-popups',
    title: 'Scan popups',
    paragraphs: [
      'After a scan, a notice slides in at the top and leaves after about 5 seconds. A WARNING or CRITICAL item shows its label in brackets and in its color. An IN STOCK item shows no label.',
      'The notice shows the item name and a Count line with the new count.',
      'After tally the sentence is Item <name> <barcode> was added to inventory. After consume it is Item <name> <barcode> was removed from inventory.',
      'After consume on a count of 0 it is Item <name> <barcode> is already at 0. The count stays 0.',
    ],
    screenshots: [
      {
        fileName: 'help-07-popup-tally.png',
        alt: 'Scan notice in dark mode after tally adds Plain flour.',
        width: 390,
        height: 844,
      },
      {
        fileName: 'help-07-popup-consume.png',
        alt: 'Scan notice in dark mode after consume removes Plain flour.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'restock',
    title: 'Restock',
    paragraphs: [
      'Restock lists only CRITICAL items, grouped by category. A count at or below the minimum is CRITICAL. A count above the minimum and below twice the minimum is WARNING. A count at least twice the minimum is IN STOCK. The default minimum is 3.',
      'Each row reads <name> ... <count> // [<n> short]. <n> is the minimum minus the count. A count equal to the minimum reads [0 short]. Inside a category, the largest shortfall is first.',
      'When no item is CRITICAL, the page says Nothing needs restocking.',
    ],
    screenshots: [
      {
        fileName: 'help-08-restock.png',
        alt: 'Restock list in dark mode with the critical shortfalls.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'lookup',
    title: 'Lookup',
    paragraphs: [
      'Lookup opens the same camera and the same Barcode field. It does not change the count.',
      'If the hab unit holds the item, the notice shows IN STOCK, WARNING, or CRITICAL in brackets, then the name and a Count line. Otherwise it says Not in your hab unit.',
      'Use it in a shop to see if that item is already at home.',
    ],
    screenshots: [
      {
        fileName: 'help-09-lookup-found.png',
        alt: 'Lookup notice in dark mode for Olive oil, which is in the hab-unit.',
        width: 390,
        height: 844,
      },
      {
        fileName: 'help-09-lookup-missing.png',
        alt: 'Lookup notice in dark mode for a barcode that is not in the hab-unit.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'item-details',
    title: 'Item details',
    paragraphs: [
      'Tap an item name on the tally. The heading shows the state label and the name. Below 460px the heading shows [I], [W], or [C] in place of the full state label.',
      'On a wide screen the barcode sits on the line under the name. On a phone, tap the name to show the barcode.',
      'The rows are Count from 0 to 99, Minimum from 0 to 999, Category with Pet food, Food, Beauty, Other, and Uncategorized, and Use.',
      'Use is information only. It counts consume scans from the last 7 days as <n> per week, or it says No use recorded.',
      '[-], [+], and the category list change Count, Minimum, and Category. Unsaved edits turn yellow gold. They apply when you press Save. Cancel drops them and returns to the tally. The state label follows the count and the minimum while you edit.',
    ],
    screenshots: [
      {
        fileName: 'help-10-item-details.png',
        alt: 'Plain flour details in dark mode, with count 2 and use of 1 per week.',
        width: 390,
        height: 844,
      },
    ],
  },
  {
    id: 'share-hab-unit',
    title: 'Sharing a hab unit',
    paragraphs: [
      'Share hab unit opens a page with Generate invite code. After you press it, the page shows Invite code, Invite link, and the expiry date.',
      'The code works once, expires in 7 days, and replaces any earlier unused code. Send the code or the link.',
      'After the other person signs up, they enter the code under Join hab-unit on the hab-unit setup page, or they open the link. They then see the same tally.',
      'Someone who already has a hab unit is refused, and that hab unit is left as it was. The page says This account already has a hab unit. Leaving a hab unit is not supported yet.',
    ],
    screenshots: [
      {
        fileName: 'help-11-share.png',
        alt: 'Share hab-unit page in dark mode after an invite code is generated.',
        width: 390,
        height: 844,
      },
    ],
  },
]

export { HELP_TOPICS }
export type { HelpScreenshotImage, HelpTopic }
