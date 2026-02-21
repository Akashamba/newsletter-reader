export default interface Publisher {
  id: string;
  name: string | null;
  emailAddress: string;
  createdAt?: Date;
  updatedAt?: Date | null;
}
