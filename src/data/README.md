# Nigerian academic-structure candidate data

`nigerian-academic-structures-candidates.json` is a conservative, structured extraction of the publicly available dataset maintained at:

- Repository: https://github.com/reality-farouqk/nigeria-tertiary-institutions-api
- Source files: `data/nigerian_universities_faculties.csv`, `data/nigerian_polytechnics_schools.csv`, and `data/nigerian_colleges_of_education_schools.csv`
- Data licence stated by the source repository: CC0 / public domain.
- Source methodology and limitations: https://github.com/reality-farouqk/nigeria-tertiary-institutions-api/blob/main/data/DATA_NOTES.md

The source repository reports 312 universities, 200 polytechnics, and 240 colleges of education. Its academic-structure fields were compiled from public sources, but it explicitly notes that not every institution publishes an itemized structure and that some records have thin or incomplete evidence. Its own parser therefore omits structures it cannot parse confidently.

This frontend copy contains only rows where the source structure could be parsed into a named faculty, school, college, or institute. It is a **candidate catalogue**, not an official NUC/NBTE/NCCE register and not a claim that every candidate has been independently re-verified against a current official institutional page.

## How the app uses it

- Exact normalized institution-name and institution-type matches are used to show institution-specific candidate structures.
- Existing database faculties and departments remain authoritative when present.
- Candidate structures not yet present under the selected institution are submitted through the existing moderator/admin review flow; they are not silently inserted or auto-approved.
- The broader shared suggestions remain available where the source has no parsed structure or the institution name does not match.
- Do not use this file as a production database import source without reviewing each institution's current official website and confirming the exact structure.

The source data should be refreshed periodically and every correction should preserve its provenance.
