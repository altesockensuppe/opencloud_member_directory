/**
 * Translations of the app, keyed by the English source text.
 *
 * OpenCloud merges app translations into its global translations, so texts that OpenCloud
 * itself already translates (e.g. "Cancel", "Close", "Apply") must use exactly the same
 * translation here. Otherwise this app would change them everywhere in OpenCloud.
 *
 * German uses Swiss spelling ("ss" instead of "ß") for the app's own texts.
 */
const translations: Record<string, Record<string, string | string[]>> = {
  de: {
    // shared with OpenCloud core, keep identical to its translations
    Actions: 'Aktionen',
    'Show details': 'Details anzeigen',
    Close: 'Schließen',
    Members: 'Mitglieder',
    Cancel: 'Abbrechen',
    Type: 'Typ',
    Apply: 'Anwenden',
    Email: 'E-Mail',
    Status: 'Status',
    New: 'Neu',
    '%{count} member': ['%{count} Mitglied', '%{count} Mitglieder'],

    // app
    'Member directory': 'Mitgliederverzeichnis',
    'The file cannot be opened': 'Datei kann nicht geöffnet werden',
    'The file is not a valid member directory.':
      'Die Datei ist kein gültiges Mitgliederverzeichnis.',
    'Title of the directory': 'Titel des Verzeichnisses',
    '%{count} shown': '%{count} angezeigt',
    'read-only': 'nur Lesezugriff',
    'Search…': 'Suchen…',
    'Search members': 'Mitglieder durchsuchen',
    Fields: 'Felder',
    Import: 'Importieren',
    Export: 'Exportieren',
    'Add member': 'Mitglied hinzufügen',
    'Edit all details': 'Alle Angaben bearbeiten',
    'Delete member': 'Mitglied löschen',
    'No members found.': 'Keine Mitglieder gefunden.',
    'No members recorded yet.': 'Noch keine Mitglieder erfasst.',
    'Add first member': 'Erstes Mitglied hinzufügen',
    'Import from CSV': 'Aus CSV importieren',
    'New member': 'Neues Mitglied',
    Member: 'Mitglied',
    'Really delete member %{name}?': 'Mitglied %{name} wirklich löschen?',
    'Really delete this member?': 'Dieses Mitglied wirklich löschen?',

    // export
    'Export list': 'Liste exportieren',
    'All members (%{count})': 'Alle Mitglieder (%{count})',
    'Only current search (%{count})': 'Nur aktuelle Suche (%{count})',
    Columns: 'Spalten',
    All: 'Alle',
    'As in the list': 'Wie in der Liste',
    'The export failed (%{detail}).': 'Der Export ist fehlgeschlagen (%{detail}).',
    'As of %{date}': 'Stand: %{date}',
    'Page %{page}': 'Seite %{page}',
    Yes: 'Ja',
    No: 'Nein',

    // fields
    'Edit fields': 'Felder bearbeiten',
    'Define which details are recorded for each member. %{inList} controls which fields are shown as columns in the overview. All fields are visible in the detail dialog.':
      'Lege fest, welche Angaben pro Mitglied erfasst werden. Mit %{inList} bestimmst du, welche Felder als Spalte in der Übersicht erscheinen. Alle Felder sind im Detaildialog sichtbar.',
    'In list': 'In Liste',
    'Move up': 'Nach oben',
    'Move down': 'Nach unten',
    Label: 'Bezeichnung',
    'Options (separated by commas)': 'Auswahlwerte (mit Komma getrennt)',
    'Delete field %{label}': 'Feld %{label} löschen',
    'Add field': 'Feld hinzufügen',
    'Warning: applying will delete the values of the following fields for all members: %{fields}':
      'Achtung: Beim Anwenden werden die Werte folgender Felder bei allen Mitgliedern gelöscht: %{fields}',
    'Every field needs a label.': 'Jedes Feld braucht eine Bezeichnung.',
    'New field': 'Neues Feld',
    Text: 'Text',
    'Multi-line text': 'Mehrzeiliger Text',
    Number: 'Zahl',
    Date: 'Datum',
    Phone: 'Telefon',
    'Selection list': 'Auswahlliste',
    'Yes/No': 'Ja/Nein',

    // default fields of a new directory
    'Member no.': 'Mitglieder-Nr.',
    Salutation: 'Anrede',
    Ms: 'Frau',
    Mr: 'Herr',
    Diverse: 'Divers',
    'First name': 'Vorname',
    'Last name': 'Nachname',
    'Street / No.': 'Strasse / Nr.',
    Postcode: 'PLZ',
    City: 'Ort',
    Country: 'Land',
    'Date of birth': 'Geburtsdatum',
    Mobile: 'Mobile',
    'Date joined': 'Eintrittsdatum',
    'Date left': 'Austrittsdatum',
    Active: 'Aktiv',
    Passive: 'Passiv',
    'Honorary member': 'Ehrenmitglied',
    Resigned: 'Ausgetreten',
    Notes: 'Bemerkungen',

    // import
    'Import members from CSV': 'Mitglieder aus CSV importieren',
    'CSV file': 'CSV-Datei',
    'The first line must contain the column names. The delimiter (semicolon, comma, tab) and character encoding are detected automatically.':
      'Die erste Zeile muss die Spaltennamen enthalten. Trennzeichen (Semikolon, Komma, Tab) und Zeichensatz werden automatisch erkannt.',
    '%{count} row found in %{file} (delimiter: %{delimiter}).': [
      '%{count} Zeile gefunden in %{file} (Trennzeichen: %{delimiter}).',
      '%{count} Zeilen gefunden in %{file} (Trennzeichen: %{delimiter}).'
    ],
    'Column in CSV': 'Spalte in CSV',
    'Import as': 'Übernehmen als',
    Example: 'Beispiel',
    'Mapping for column %{column}': 'Zuordnung für Spalte %{column}',
    'New field %{label}': 'Neues Feld %{label}',
    'do not import': 'nicht importieren',
    'Existing members (%{count})': 'Vorhandene Mitglieder (%{count})',
    'Add imported members': 'Importierte Mitglieder hinzufügen',
    'Replace all existing members': 'Alle vorhandenen Mitglieder ersetzen',
    '%{count} member will be imported.': [
      '%{count} Mitglied wird importiert.',
      '%{count} Mitglieder werden importiert.'
    ],
    'New fields: %{fields}.': 'Neue Felder: %{fields}.',
    'Several columns are joined into: %{fields}.':
      'Mehrere Spalten werden zusammengefügt in: %{fields}.',
    'Dates are read with the day before the month, e.g. %{examples}.':
      'Datumswerte werden mit dem Tag vor dem Monat gelesen, z. B. %{examples}.',
    '%{count} date was not recognized and is imported as text.': [
      '%{count} Datumswert wurde nicht erkannt und wird als Text übernommen.',
      '%{count} Datumswerte wurden nicht erkannt und werden als Text übernommen.'
    ],
    'Really replace the %{count} existing member?': [
      'Das %{count} vorhandene Mitglied wirklich ersetzen?',
      'Wirklich alle %{count} vorhandenen Mitglieder ersetzen?'
    ],
    semicolon: 'Semikolon',
    comma: 'Komma',
    tab: 'Tabulator',
    'Column %{column}': 'Spalte %{column}',
    'The file contains no data below the header line.':
      'Die Datei enthält keine Daten unterhalb der Kopfzeile.',
    'The file could not be read.': 'Die Datei konnte nicht gelesen werden.',

    // start page
    'A member directory is a file with the extension %{extension}. It is stored like any other file in OpenCloud and can be shared with others using the regular sharing options.':
      'Ein Mitgliederverzeichnis ist eine Datei mit der Endung %{extension}. Sie liegt wie jede andere Datei in OpenCloud und kann über die normale Freigabe mit anderen geteilt werden.',
    'Open the file view and go to the folder or space you want.':
      'Öffne die Dateiansicht und wechsle in den gewünschten Ordner oder Space.',
    'Choose %{menu} and enter a name.': 'Wähle %{menu} und vergib einen Namen.',
    'Click an existing %{extension} file to open it.':
      'Bestehende %{extension}-Dateien öffnest du mit einem Klick.',
    'Go to files': 'Zu den Dateien'
  }
}

export default translations
