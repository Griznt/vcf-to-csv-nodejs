module.exports = Object.freeze({
  VCARD_HEADLINES_MAPPING: [
    { "X-GENDER": "Geschlecht" },
    { "N:2": "Vorname" },
    { "N:3": "Mittelname" },
    { "N:1": "Nachname" },
    { "TITLE:1": "Titel" },
    { "ORG:1": "Accountname" },
    { "ADR:3": "Strasse (Postanschrift)" },
    { "ADR:4": "Stadt (Postanschrift)" },
    { "ADR:5": "Bundesland (Postanschrift)" },
    { "ADR:6": "PLZ (Postanschrift)" },
    { "ADR:7": "Land (Postanschrift)" },
    { "TEL;TYPE=work,voice": "Telefon" },
    { "TEL;TYPE=work,fax": "Fax" },
    { "TEL;TYPE=cell,voice": "Mobiltelefon" },
    { "EMAIL;TYPE=work": "E-Mail" },
    { "": "Accountinhaber" },
    { "X-SOCIALPROFILE;TYPE=linkedin": "LinkedIn ID" },
    { "X-SOCIALPROFILE;TYPE=xing": "Xing ID" },
    { "X-SOCIALPROFILE;TYPE=twitter": "Twitter ID" },
    { "X-SOCIALPROFILE;TYPE=facebook": "Facebook ID" },
    { "X-SOCIALPROFILE;TYPE=aboutme": "AboutMe ID" },
    { "X-SOCIALPROFILE;TYPE=google": "Google ID" },
    { "ORG:2": "Abteilung" },
    { "BDAY;ALTID=1": "Geburtsdatum" },
    { "TEL;TYPE=home,voice": "Telefon privat" },
    { "ADR:1": "Postanschrift Zeile 1" },
    { "ADR:2": "Postanschrift Zeile 2" },
    { "PHOTO;VALUE=uri": "Photo" },
    { "URL:1": "Website" },
    { NICKNAME: "Nickname" },
    { "IMPP;X-SERVICE-TYPE=Skype": "Skype ID" }
  ],
  PREFIX: "BEGIN:VCARD",
  POSTFIX: "END:VCARD",
  HEADLINES_MAPPING_FILENAME_2: "headlines-mapping.json",
  ADDITIONAL_PARSING_SETTINGS_FILENAME_2: "additional-parsing-settings.json",
  DATE_PARSE_REGEXP: /^(\d{1,4})-(\d{1,4})-(\d{1,4})$/,
  DATE_FORMAT: "MM/DD/YYYY",
  ADDITIONAL_PARSING_RULES: { CONCAT: "CONCAT" },
  ADDITIONAL_PARSING_CONDITIONS: [
    {
      CONCAT: [{ "ADR:3": ["ADR:2", "ADR:1"] }],
      replaceSource: true,
      mergeWith: "\n"
    },
    {
      CONCAT: [
        {
          FULLNAME: ["N:2", "N:3", "N:4", "N:5", "N:6", "N:7", "NOT_EXISTED"]
        }
      ],
      replaceSource: false,
      newField: true,
      mergeWith: " "
    }
  ]
});
