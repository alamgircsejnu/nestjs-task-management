import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';

@Injectable()
export class TasksService {
  private logger = new Logger('TasksService');
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

      try {
        const tasks = await query.getMany();
        return tasks;
      } catch (error) {
        this.logger.error(`Failed to get tasks for user "${user.username}". Filters: ${JSON.stringify(filterDto)}`, error.stack);
        throw new InternalServerErrorException();
      }
  }

  async getTaskById(id: number, user: User): Promise<Task> {
    console.log(user);
    const found = await this.taskRepository.findOne({ where: { id, userId: user.id } });

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

    try {
      await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Failed to create a task for user "${user.username}". Data: ${JSON.stringify(createTaskDto)}`, error.stack);
      throw new InternalServerErrorException();
    }

    delete task.user;

    return task;
  }

  async deleteTask(id: number, user: User): Promise<void> {
    const result = await this.taskRepository.delete({id, userId: user.id});
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

// deleteTask(id: string): void {
// const found = this.getTaskById(id);
// this.tasks = this.tasks.filter(task => task.id !== found.id);
// }

  async updateTaskStatus(id: number, status: TaskStatus, user: User): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;
    await this.taskRepository.save(task);
    return task;
  }
}
