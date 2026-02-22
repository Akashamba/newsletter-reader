export default interface Publisher {
  id: string;
  name: string | null;
  emailAddress: string;
  defaultIconColor: string;
  createdByUserId: string;
  createdAt?: Date;
  updatedAt?: Date | null;
}
