import * as React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation } from "@react-navigation/native";

import { Category, Transaction, TransactionsByMonth } from "../types";
import TransactionList from "../components/TransactionsList";
import Card from "../components/ui/Card";
import AddTransaction from "../components/AddTransaction";
import SummaryChart from "../components/SummaryChart";

export default function Home() {
  const navigation = useNavigation();
  const db = useSQLiteContext();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsByMonth, setTransactionsByMonth] =
    React.useState<TransactionsByMonth>({
      totalExpenses: 0,
      totalIncome: 0,
    });

  React.useEffect(() => {
    db.withTransactionAsync(async () => {
      await getData();
    });
  }, [db]);

  async function getData() {
    const result = await db.getAllAsync<Transaction>(
      `SELECT * FROM Transactions ORDER BY date DESC LIMIT 10;`
    );
    setTransactions(result);

    const categoriesResult = await db.getAllAsync<Category>(
      `SELECT * FROM Categories;`
    );
    setCategories(categoriesResult);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startTs = Math.floor(startOfMonth.getTime() / 1000);
    const endTs = Math.floor(endOfMonth.getTime() / 1000);

    const resultMonth = await db.getAllAsync<TransactionsByMonth>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS totalExpenses,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS totalIncome
      FROM Transactions
      WHERE date BETWEEN ? AND ?;
      `,
      [startTs, endTs]
    );

    setTransactionsByMonth(resultMonth[0]);
  }

  async function deleteAllTransactions() {
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM Transactions;`);
      await getData();
    });
  }

  async function deleteTransaction(id: number) {
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM Transactions WHERE id = ?;`, [id]);
      await getData();
    });
  }

  async function insertTransaction(transaction: Transaction) {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `
        INSERT INTO Transactions (category_id, amount, date, description, type)
        VALUES (?, ?, ?, ?, ?);
        `,
        [
          transaction.category_id,
          transaction.amount,
          transaction.date,
          transaction.description,
          transaction.type,
        ]
      );
      await getData();
    });
  }

  return (
    <ScrollView
  contentContainerStyle={[
    styles.container,
    { paddingBottom: 50 },
  ]}
>
      {/* Summary */}
      <MonthlySummary
        totalIncome={transactionsByMonth.totalIncome}
        totalExpenses={transactionsByMonth.totalExpenses}
      />

      {/* Primary CTA */}
      <AddTransaction insertTransaction={insertTransaction} />

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <TransactionList
        categories={categories}
        transactions={transactions}
        deleteTransaction={deleteTransaction}
      />

      {/* Danger action */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={deleteAllTransactions}
      >
        <Text style={styles.deleteText}>Delete all transactions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------ Summary Card ------------------ */

function MonthlySummary({
  totalIncome,
  totalExpenses,
}: TransactionsByMonth) {
  const savings = totalIncome - totalExpenses;
  const period = new Date().toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.period}>{period}</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Income</Text>
          <Text style={[styles.amount, { color: "#16A34A" }]}>
            ${totalIncome.toFixed(2)}
          </Text>
        </View>

        <View>
          <Text style={styles.label}>Expense</Text>
          <Text style={[styles.amount, { color: "#DC2626" }]}>
            ${totalExpenses.toFixed(2)}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.savings,
          { color: savings >= 0 ? "#16A34A" : "#DC2626" },
        ]}
      >
        Savings: ${savings.toFixed(2)}
      </Text>

      <SummaryChart />
    </Card>
  );
}

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F7F8FA",
  },
  summaryCard: {
    marginBottom: 16,
  },
  period: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
  },
  savings: {
    marginBottom: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
  },
  deleteButton: {
    marginTop: 24,
    alignItems: "center",
  },
  deleteText: {
    color: "#DC2626",
    fontSize: 14,
  },
});
