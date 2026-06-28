/* sql-data.js — seed schemas + sample rows for the runnable practice blocks.
 * Each schema is an array of SQL statements (CREATE TABLE + INSERT) run into a
 * fresh in-memory AlaSQL database every time the user presses ▶ Run, so one run
 * never sees another run's leftovers. Keyed by the `data-schema` value used in
 * the lessons. Add a new schema by adding a new key here — nothing else changes.
 *
 * Datasets are sized to feel like a real table (≈20 rows each) yet stay
 * hand-checkable, with valid foreign keys throughout. Deliberate properties the
 * exercises lean on: Toyota is the unique most-common brand; 2025 is the newest
 * year, 2008 the oldest; accidents involve 1..3 cars with varying damage (acc 8
 * has the single highest avg); a few cars have >1 owner and people own >1 car;
 * cars c05/c07 have more accidents in 2023 than 2024 (for the future 6.5 type);
 * books span multiple genres and loans mix returned / still-out (NULL).
 */
(function (root) {
  'use strict';

  var SCHEMAS = {

    /* ב' — car-insurance (the most common exam schema) */
    'car-insurance': [
      "CREATE TABLE person (id INT, fname STRING, lname STRING, street STRING, city STRING, birth STRING)",
      "INSERT INTO person VALUES " +
        "(100,'David','Levi','Herzl 1','Tel Aviv','1990-01-01')," +
        "(101,'Sara','Cohen','Dizengoff 5','Haifa','1985-03-12')," +
        "(102,'Moshe','Mizrahi','Ben Gurion 9','Haifa','1978-07-23')," +
        "(103,'Noa','Friedman','Allenby 20','Tel Aviv','2000-11-30')," +
        "(104,'Yossi','Shem Tov','Weizmann 3','Jerusalem','1995-05-05')," +
        "(105,'Tamar','Bar','Sokolov 12','Haifa','1992-09-18')," +
        "(106,'Avi','Golan','Bialik 7','Tel Aviv','1982-02-02')," +
        "(107,'Rina','Katz','Rotschild 44','Beer Sheva','1975-12-25')," +
        "(108,'Dan','Peretz','Herzl 8','Haifa','1998-06-14')," +
        "(109,'Maya','Azulay','Arlozorov 2','Tel Aviv','2001-04-09')," +
        "(110,'Eitan','Shapira','King George 5','Jerusalem','1988-08-08')," +
        "(111,'Lior','Ben David','Hanassi 19','Haifa','1993-03-03')," +
        "(112,'Gal','Hadad','Weizmann 30','Netanya','1979-10-10')," +
        "(113,'Yael','Cohen','Ben Yehuda 1','Tel Aviv','1996-07-07')," +
        "(114,'Omer','Levi','Moriah 60','Haifa','1984-01-29')," +
        "(115,'Shira','Mor','Jaffa 100','Jerusalem','2002-05-21')",

      "CREATE TABLE car (license STRING, model STRING, brand STRING, year INT)",
      "INSERT INTO car VALUES " +
        "('11-111-11','Corolla','Toyota',2018)," +
        "('22-222-22','Model 3','Tesla',2024)," +
        "('33-333-33','Golf','Volkswagen',2024)," +
        "('44-444-44','Civic','Honda',2010)," +
        "('55-555-55','Camry','Toyota',2022)," +
        "('66-666-66','Model Y','Tesla',2021)," +
        "('77-777-77','Yaris','Toyota',2016)," +
        "('88-888-88','Model S','Tesla',2025)," +
        "('99-999-99','Accord','Honda',2019)," +
        "('10-101-10','Passat','Volkswagen',2015)," +
        "('12-121-12','RAV4','Toyota',2023)," +
        "('13-131-13','CX-5','Mazda',2020)," +
        "('14-141-14','Sportage','Kia',2021)," +
        "('15-151-15','X5','BMW',2022)," +
        "('16-161-16','i20','Hyundai',2017)," +
        "('17-171-17','Prius','Toyota',2014)," +
        "('18-181-18','Mazda3','Mazda',2013)," +
        "('19-191-19','Niro','Kia',2024)," +
        "('20-202-20','Jetta','Volkswagen',2012)," +
        "('21-212-21','Fit','Honda',2008)," +
        "('23-232-23','Model 3','Tesla',2023)," +
        "('24-242-24','Highlander','Toyota',2025)," +
        "('25-252-25','Impreza','Subaru',2019)," +
        "('26-262-26','Forester','Subaru',2021)," +
        "('27-272-27','Outback','Subaru',2023)",   // Subaru: 3 cars, no accidents -> 0-count brand for Q6.4

      "CREATE TABLE owns (id INT, license STRING)",
      "INSERT INTO owns VALUES " +
        "(100,'11-111-11'),(100,'55-555-55'),(101,'22-222-22'),(101,'77-777-77')," +
        "(102,'33-333-33'),(102,'44-444-44'),(103,'66-666-66'),(104,'77-777-77')," +
        "(105,'99-999-99'),(105,'12-121-12'),(106,'10-101-10'),(106,'11-111-11')," +
        "(107,'13-131-13'),(108,'14-141-14'),(108,'88-888-88'),(109,'15-151-15')," +
        "(110,'16-161-16'),(111,'17-171-17'),(112,'18-181-18'),(113,'19-191-19')," +
        "(113,'20-202-20'),(114,'21-212-21'),(114,'23-232-23'),(115,'24-242-24')," +
        "(100,'12-121-12')",   // David's 3rd car -> clear winner for "owns most / most cars in accidents" (L9 Q9.2)

      "CREATE TABLE accident (accident_id INT, license STRING, [date] STRING, driver_id INT, damage INT, garage_id INT)",
      "INSERT INTO accident VALUES " +
        "(1,'11-111-11','2024-01-10',100,1000,7)," +
        "(1,'22-222-22','2024-01-10',101,3000,7)," +
        "(2,'33-333-33','2023-05-05',102,5000,8)," +
        "(3,'44-444-44','2024-07-07',102,200,8)," +
        "(3,'55-555-55','2024-07-07',100,400,8)," +
        "(4,'77-777-77','2023-09-09',104,1500,7)," +
        "(5,'77-777-77','2024-02-02',101,800,9)," +
        "(6,'11-111-11','2023-03-03',100,600,9)," +
        "(7,'99-999-99','2024-04-04',105,2500,8)," +
        "(7,'12-121-12','2024-04-04',105,2200,8)," +
        "(7,'14-141-14','2024-04-04',109,9000,10)," +
        "(8,'88-888-88','2025-01-15',108,7000,10)," +
        "(9,'13-131-13','2022-06-06',107,1200,11)," +
        "(10,'14-141-14','2023-08-08',108,300,11)," +
        "(10,'15-151-15','2023-08-08',110,450,11)," +
        "(11,'16-161-16','2024-11-11',111,1800,7)," +
        "(12,'18-181-18','2024-12-12',113,2000,12)," +
        "(12,'19-191-19','2024-12-12',113,2400,12)," +
        "(13,'20-202-20','2023-02-02',114,100,12)," +
        "(14,'21-212-21','2024-03-03',114,5500,10)," +
        "(15,'24-242-24','2025-05-05',115,6000,10)," +
        "(16,'55-555-55','2023-07-07',100,700,8)," +
        "(17,'55-555-55','2023-11-11',100,350,8)," +
        "(18,'77-777-77','2023-12-12',101,900,9)," +
        "(19,'11-111-11','2024-06-01',100,1100,14)," +
        "(20,'12-121-12','2024-06-05',100,1300,15)," +
        "(21,'44-444-44','2024-06-03',102,900,14)",   // Jaffa repairs: David covers BOTH Jaffa garages (->9.3), Moshe only one",

      "CREATE TABLE garage (garage_id INT, garage_name STRING, street STRING, city STRING)",
      "INSERT INTO garage VALUES " +
        "(7,'Speedy Fix','Industrial 1','Tel Aviv')," +
        "(8,'AutoCare','Industrial 2','Haifa')," +
        "(9,'Gal Garage','Industrial 3','Jerusalem')," +
        "(10,'Pro Motors','Industrial 4','Tel Aviv')," +
        "(11,'Fix It','Industrial 5','Beer Sheva')," +
        "(12,'North Garage','Industrial 6','Netanya')," +
        "(13,'Quiet Motors','Industrial 7','Eilat')," +   // handles NO accidents -> shows the 0-count outer-join case
        "(14,'Jaffa Auto','Yefet 10','Jaffa')," +
        "(15,'Marina Garage','Retsif 2','Jaffa')"         // two Jaffa garages -> division "repaired in ALL Jaffa garages" (L8 Q9.3)
    ],

    /* ג' — library */
    'library': [
      "CREATE TABLE Authors (author_id INT, name STRING, birth_year INT)",
      "INSERT INTO Authors VALUES " +
        "(10,'A. Writer',1950),(11,'B. Scholar',1972),(12,'C. Penn',1988)," +
        "(13,'D. Quill',1965),(14,'E. Verse',1979),(15,'F. Tales',1991)," +
        "(16,'G. Sage',1955),(17,'H. Young',2000)",

      "CREATE TABLE Books (isbn STRING, title STRING, publ_year INT, pages INT, author_id INT, num_copies INT)",
      "INSERT INTO Books VALUES " +
        "('B001','Dragons',2001,320,10,5)," +
        "('B002','Magic',2010,210,10,2)," +
        "('B003','Atoms',2015,400,11,8)," +
        "('B004','Rome',1999,500,12,3)," +
        "('B005','Stars',2020,150,11,4)," +
        "('B006','Wizards',2005,360,10,6)," +
        "('B007','Quantum',2018,280,11,5)," +
        "('B008','Empires',2012,540,12,2)," +
        "('B009','Rhymes',2008,120,14,7)," +
        "('B010','Forest',2016,200,15,9)," +
        "('B011','Galaxy',2021,330,11,3)," +
        "('B012','Castles',2003,420,13,4)," +
        "('B013','Comets',2019,180,11,6)," +
        "('B014','Legends',2014,390,15,5)," +
        "('B015','Kingdom',2009,460,13,2)," +
        "('B016','Particles',2022,260,17,8)," +
        "('B017','Verses',2011,140,14,3)," +
        "('B018','Knights',2006,410,12,4)," +
        "('B019','Nebula',2023,300,17,5)," +
        "('B020','Sagas',2000,480,16,2)",

      "CREATE TABLE Genres (genre_id INT, genre_name STRING)",
      "INSERT INTO Genres VALUES " +
        "(1,'Fantasy'),(2,'Science'),(3,'History'),(4,'Fiction'),(5,'Children'),(6,'Poetry')",

      "CREATE TABLE Book_Genres (isbn STRING, genre_id INT)",
      "INSERT INTO Book_Genres VALUES " +
        "('B001',1),('B001',4),('B002',1),('B003',2),('B004',3)," +
        "('B005',2),('B005',5),('B006',1),('B007',2),('B008',3)," +
        "('B009',6),('B009',5),('B010',5),('B010',1),('B011',2)," +
        "('B012',1),('B012',3),('B013',2),('B014',1),('B015',3)," +
        "('B015',4),('B016',2),('B017',6),('B018',3),('B019',2)," +
        "('B019',4),('B020',1),('B020',3)",

      "CREATE TABLE Borrowers (borrower_id INT, name STRING, phone_number STRING, address STRING)",
      "INSERT INTO Borrowers VALUES " +
        "(200,'Dana','050-1111111','Tel Aviv')," +
        "(201,'Eli','050-2222222','Haifa')," +
        "(202,'Rotem','050-3333333','Jerusalem')," +
        "(203,'Noam','050-4444444','Haifa')," +
        "(204,'Tal','050-5555555','Tel Aviv')," +
        "(205,'Adi','050-6666666','Beer Sheva')," +
        "(206,'Yarden','050-7777777','Netanya')," +
        "(207,'Shai','050-8888888','Haifa')",

      "CREATE TABLE Loans (loan_id INT, book_isbn STRING, borrower_id INT, loan_date STRING, return_date STRING)",
      "INSERT INTO Loans VALUES " +
        "(300,'B001',200,'2024-01-01','2024-01-15')," +
        "(301,'B003',201,'2024-02-01',NULL)," +
        "(302,'B001',201,'2024-03-01',NULL)," +
        "(303,'B005',202,'2023-12-10','2024-01-05')," +
        "(304,'B007',203,'2024-04-01','2024-04-20')," +
        "(305,'B009',204,'2024-05-05',NULL)," +
        "(306,'B002',205,'2023-11-11','2023-12-01')," +
        "(307,'B010',206,'2024-06-06',NULL)," +
        "(308,'B004',200,'2024-02-15','2024-03-01')," +
        "(309,'B012',207,'2024-07-07',NULL)," +
        "(310,'B006',201,'2024-08-08','2024-08-20')," +
        "(311,'B003',202,'2024-09-09',NULL)," +
        "(312,'B014',203,'2023-10-10','2023-11-01')," +
        "(313,'B016',204,'2024-10-10',NULL)," +
        "(314,'B008',205,'2024-03-03','2024-03-30')," +
        "(315,'B011',206,'2024-11-11',NULL)," +
        "(316,'B013',200,'2024-01-20','2024-02-10')," +
        "(317,'B019',207,'2024-12-01',NULL)," +
        "(318,'B005',201,'2024-05-25','2024-06-10')," +
        "(319,'B018',202,'2023-09-09','2023-10-01')," +
        "(320,'B001',203,'2024-06-15',NULL)," +
        "(321,'B020',204,'2024-07-20','2024-08-05')," +
        "(322,'B007',205,'2024-08-25',NULL)," +
        "(323,'B010',200,'2024-09-30',NULL)"
    ]

  };

  root.SQL_SCHEMAS = SCHEMAS;
})(typeof window !== 'undefined' ? window : globalThis);
