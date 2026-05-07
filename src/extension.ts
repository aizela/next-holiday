// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as https from 'node:https';
import dayjs from 'dayjs';

const chineseDaysUrl = 'https://cdn.jsdelivr.net/npm/chinese-days/dist/chinese-days.json';

interface Holiday {
	name: string;
	time: string;
	length: string;
}

interface Days {
	holidays: Record<string, string>;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 9999);
	statusBarItem.text = '假期数据加载中...';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	void updateHolidayStatus(statusBarItem);
}

async function updateHolidayStatus(statusBarItem: vscode.StatusBarItem) {
	try {
		const days = await loadChineseDays();
		const nextHoliday = getNextHoliday(days);

		if (!nextHoliday) {
			statusBarItem.text = '今年没有更多假期数据';
			return;
		}

		statusBarItem.text = `距离下一个节日[${nextHoliday.holiday.name}]还有${nextHoliday.duration}天,放假${nextHoliday.holiday.length}天`;
	} catch (error) {
		statusBarItem.text = '假期数据加载失败';
		const message = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(`加载假期数据失败: ${message}`);
	}
}

function getNextHoliday(days: Days): { holiday: Holiday; duration: number } | undefined {
	let lastHoliday: Holiday = { name: '', time: '', length: '' };
	let duration: number = 0;
	const { holidays } = days;
	const now = dayjs().format('YYYY-MM-DD');
	const currentYear = dayjs().format('YYYY');

	// 本年度的假期
	const currentYearHoliday: Array<string> = [];
	Object.keys(holidays).forEach((key: string) => {
		if (key.startsWith(currentYear)) {
			currentYearHoliday.push(key);
		}
	});

	currentYearHoliday.sort();

	for (let i = 0; i < currentYearHoliday.length; i++) {
		const item: string = currentYearHoliday[i];
		if (!dayjs(item).isBefore(now)) {
			duration = dayjs(item).diff(dayjs(), 'day');
			const holidayDetails = holidays[item].split(',');
			lastHoliday.name = holidayDetails[1];
			lastHoliday.time = item;
			lastHoliday.length = holidayDetails[2];
			break;
		}
	}

	if (!lastHoliday.name) {
		return undefined;
	}

	return { holiday: lastHoliday, duration };
}

function loadChineseDays(): Promise<Days> {
	return new Promise((resolve, reject) => {
		https.get(chineseDaysUrl, response => {
			if (response.statusCode !== 200) {
				response.resume();
				reject(new Error(`CDN 返回状态码 ${response.statusCode}`));
				return;
			}

			response.setEncoding('utf8');
			let rawData = '';
			response.on('data', chunk => {
				rawData += chunk;
			});
			response.on('end', () => {
				try {
					resolve(parseChineseDays(rawData));
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', reject);
	});
}

function parseChineseDays(rawData: string): Days {
	const data = JSON.parse(rawData) as Partial<Days>;

	if (!data.holidays || typeof data.holidays !== 'object') {
		throw new Error('CDN 数据格式不正确');
	}

	return {
		holidays: data.holidays,
	};
}

// This method is called when your extension is deactivated
export function deactivate() { }
