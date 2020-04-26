import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Type of transactions is invalid!');
    }

    if (type === 'outcome') {
      const { total } = await transactionRepository.getBalance();
      if (total < value) {
        throw new AppError('Balance ins´t enough!');
      }
    }

    const categoryModel = getRepository(Category);

    let categoryFound = await categoryModel.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryFound) {
      categoryFound = categoryModel.create({ title: category });

      await categoryModel.save(categoryFound);
    }

    const newTransaction = transactionRepository.create({
      title,
      value,
      type,
      category: categoryFound,
    });

    await transactionRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
