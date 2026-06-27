# Joins (Lesson 2) — demonstrated, not just covered

The user independently wrote a correct `join ... on` query for Lesson 2 Exercise 1 (`select distinct fname, lname from person join owns on owns.id = person.id`) and asked whether it was valid — evidence of genuine understanding of inner joins, not just exposure. They also asked to have all three join forms (comma+where, join..on, natural join) shown in every solution, which were added.

Floor now includes: multi-table inner joins (all three syntaxes), column qualification, the N→N−1 join-conditions rule. Lesson 3 (`LIKE`) built on top, ending with a real join+LIKE exam question (6.2). Next in ZPD: **aggregation** — `group by` / `having` / count/avg/min/max (Lesson 4). See [[MISSION.md]].
