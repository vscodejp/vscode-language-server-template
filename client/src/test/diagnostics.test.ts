import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should get diagnostics', () => {
	const docUri = getDocUri('diagnostics.txt');

	test('Diagnostics Upper to lower', async () => {
		await testDiagnostics(docUri, [
			{
				message: 'COBOL is all uppercase.',
				// 2行目のCOBOLに警告を出すか検証
				range: new vscode.Range(
					new vscode.Position(1, 0),
					new vscode.Position(1, 5)
				),
				severity: vscode.DiagnosticSeverity.Warning,
				source: 'sample'
			},
			{
				message: 'PHP is all uppercase.',
				range: new vscode.Range(
					// 6行目のPHPに警告を出すか検証
					new vscode.Position(5, 0),
					new vscode.Position(5, 3)
				),
				severity: vscode.DiagnosticSeverity.Warning,
				source: 'sample'
			},
		]);
	});
});

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
	await activate(docUri);

	const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

	assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

	expectedDiagnostics.forEach((expectedDiagnostic, i) => {
		const actualDiagnostic = actualDiagnostics[i];
		assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
		assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
		assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
	});
}