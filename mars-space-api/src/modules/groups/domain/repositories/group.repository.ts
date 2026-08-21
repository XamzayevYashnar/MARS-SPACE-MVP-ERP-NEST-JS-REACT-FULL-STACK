import { Paginated } from '../../../../common/interfaces';
import { CreateGroupData, Group, GroupQuery, UpdateGroupData } from '../entities/group.entity';

export abstract class GroupRepository {
  abstract findMany(query: GroupQuery): Promise<Paginated<Group>>;
  abstract findById(id: string): Promise<Group | null>;
  abstract existsByName(name: string, excludeId?: string): Promise<boolean>;
  abstract create(data: CreateGroupData): Promise<Group>;
  abstract update(id: string, data: UpdateGroupData): Promise<Group>;
  abstract delete(id: string): Promise<void>;
  abstract countStudents(id: string): Promise<number>;
}
