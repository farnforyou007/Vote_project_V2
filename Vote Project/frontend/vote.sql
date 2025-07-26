-- ตาราง Department
CREATE TABLE Department (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL
);

-- ตาราง Role
CREATE TABLE Role (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name ENUM('student','applicant','committee','admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตาราง Education_Levels
CREATE TABLE Education_Levels (
  level_id INT AUTO_INCREMENT PRIMARY KEY,
  level_code VARCHAR(10) NOT NULL,
  level_name VARCHAR(255) NOT NULL
);

-- ตาราง Year_Levels
CREATE TABLE Year_Levels (
  year_id INT AUTO_INCREMENT PRIMARY KEY,
  level_id INT,
  year_number INT,
  year_name VARCHAR(255),
  FOREIGN KEY (level_id) REFERENCES Education_Levels(level_id)
);

-- ตาราง Users
CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  department INT,
  year_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department) REFERENCES Department(department_id),
  FOREIGN KEY (year_id) REFERENCES Year_Levels(year_id)
);

-- ตาราง User_Roles
CREATE TABLE User_Roles (
  user_role_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  role_id INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (role_id) REFERENCES Role(role_id)
);

-- ตาราง Elections
CREATE TABLE Elections (
  election_id INT AUTO_INCREMENT PRIMARY KEY,
  election_name VARCHAR(255),
  description TEXT,
  registration_start DATE,
  registration_end DATE,
  start_date DATE,
  end_date DATE,
  status ENUM('active','closed','completed'),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- ตาราง Election_Eligibility
CREATE TABLE Election_Eligibility (
  eligibility_id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT,
  user_id INT,
  can_vote BOOLEAN DEFAULT FALSE,
  can_apply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES Elections(election_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ตาราง Absentee_Records
CREATE TABLE Absentee_Records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  election_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (election_id) REFERENCES Elections(election_id)
);

-- ตาราง Applications
CREATE TABLE Applications (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT,
  user_id INT,
  campaign_slogan VARCHAR(255),
  application_status ENUM('pending','approved','rejected'),
  photo VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES Elections(election_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (reviewed_by) REFERENCES Users(user_id)
);

-- ตาราง Candidates
CREATE TABLE Candidates (
  candidate_id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT,
  campaign_slogan VARCHAR(255),
  status ENUM('pending','approved','rejected'),
  photo VARCHAR(255),
  reviewed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES Applications(application_id),
  FOREIGN KEY (reviewed_by) REFERENCES Users(user_id)
);

-- ตาราง Committee_Reviews
CREATE TABLE Committee_Reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT,
  committee_id INT,
  decision ENUM('approve','reject','pending'),
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES Candidates(candidate_id),
  FOREIGN KEY (committee_id) REFERENCES Users(user_id)
);

-- ตาราง Votes
CREATE TABLE Votes (
  vote_id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT,
  voter_id INT,
  candidate_id INT,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES Elections(election_id),
  FOREIGN KEY (voter_id) REFERENCES Users(user_id),
  FOREIGN KEY (candidate_id) REFERENCES Candidates(candidate_id)
);

-- ตาราง Vote_History
CREATE TABLE Vote_History (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  election_id INT,
  participated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (election_id) REFERENCES Elections(election_id)
);

-- ตาราง Election_Result
CREATE TABLE Election_Result (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT,
  candidate_id INT,
  vote_count INT,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rank INT,
  FOREIGN KEY (election_id) REFERENCES Elections(election_id),
  FOREIGN KEY (candidate_id) REFERENCES Candidates(candidate_id)
);
