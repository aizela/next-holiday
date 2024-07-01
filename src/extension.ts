// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import dayjs from 'dayjs'
import days from './chinese-days.json'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	interface Holiday {
		name: string;
		time: string;
		leng: string;
	}
	interface Days {
		holidays: Record<string, string>;
	}

	let lastHoliday: Holiday = { name: '', time: '', leng: '' }
	let duration: number = 0
	const allDays: Days = days
	const { holidays } = allDays
	// console.log(holidays)
	const now = dayjs().format('YYYY-MM-DD')
	const currentYear = dayjs().format('YYYY')

	// 本年度的假期
	const currentYearHoliday: Array<string> = []
	Object.keys(holidays).forEach((key: string) => {
		if (key.indexOf(currentYear) >= 0) {
			currentYearHoliday.push(key)
		}
	})

	for (let i = 0; i < currentYearHoliday.length; i++) {
		let item: string = currentYearHoliday[i]
		if (!dayjs(item).isBefore(now)) {
			duration = dayjs(item).diff(dayjs(), 'day')
			// console.log(holidays[item])
			const holidayDetails = holidays[item].split(',');
			lastHoliday.name = holidayDetails[1];
			lastHoliday.time = item;
			lastHoliday.leng = holidayDetails[2];
			break
		}
	}

	const statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 9999);
	statusBarItem.text = "距离下一个节日[" + lastHoliday.name + "]还有" + duration + "天," + "放假" + lastHoliday.leng + "天";


	// 显示
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() { }
