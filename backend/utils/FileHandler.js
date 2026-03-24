import fs from "fs";

const FILE_PATH = "./user.json";

export const readUsers = () => {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]));
  }

  const data = fs.readFileSync(FILE_PATH);
  return JSON.parse(data);
};

export const writeUsers = (users) =>{
  fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
};
