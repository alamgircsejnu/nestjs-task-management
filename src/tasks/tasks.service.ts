import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';

@Injectable()
export class TasksService {

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async getTasks(
    filterDto: GetTaskFilterDto,
    user: User
  ): Promise<Task[]> {
      const { status, search } = filterDto;

      const query = this.taskRepository.createQueryBuilder('task');
      query.where('task.userId = :userId', {userId: user.id});

      if (status) {
          query.andWhere('task.status = :status', {status})
      }

      if (search) {
          query.andWhere('task.title LIKE :search OR task.description LIKE :search', {search: `%${search}%`})
      }
      const tasks = await query.getMany();

      return tasks;
  }

  async getTaskById(id: number): Promise<Task> {
    const found = await this.taskRepository.findOne({ where: { id } });

    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return found;
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    user: User
  ): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = new Task();
    task.title = title;
    task.description = description;
    task.status = TaskStatus.OPEN;
    task.user = user;
    await this.taskRepository.save(task);

    delete task.user;

    return task;
  }

  async deleteTask(id: number): Promise<void> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

// deleteTask(id: string): void {
// const found = this.getTaskById(id);
// this.tasks = this.tasks.filter(task => task.id !== found.id);
// }

  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.getTaskById(id);
    task.status = status;
    await this.taskRepository.save(task);
    return task;
  }
}
