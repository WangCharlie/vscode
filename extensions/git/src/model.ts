/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { EventEmitter, Event } from 'vscode';
import { Repository, IRef, IFileStatus, IRemote } from './git';
import { throttle } from './util';
import { decorate, debounce } from 'core-decorators';

export class Model {

	private _onDidChange = new EventEmitter<void>();
	readonly onDidChange: Event<void> = this._onDidChange.event;

	constructor(private repository: Repository) {

	}

	private _status: IFileStatus[];
	get status(): IFileStatus[] {
		return this._status;
	}

	private _HEAD: IRef | undefined;
	get HEAD(): IRef | undefined {
		return this._HEAD;
	}

	private _refs: IRef[];
	get refs(): IRef[] {
		return this._refs;
	}

	private _remotes: IRemote[];
	get remotes(): IRemote[] {
		return this._remotes;
	}

	@debounce(500)
	triggerUpdate(): void {
		this.update();
	}

	@decorate(throttle)
	private async update(): Promise<void> {
		console.log('START');
		const status = await this.repository.getStatus();
		let HEAD: IRef | undefined;

		try {
			HEAD = await this.repository.getHEAD();

			if (HEAD.name) {
				try {
					HEAD = await this.repository.getBranch(HEAD.name);
				} catch (err) {
					// noop
				}
			}
		} catch (err) {
			// noop
		}

		const [refs, remotes] = await Promise.all([this.repository.getRefs(), this.repository.getRemotes()]);

		this._status = status;
		this._HEAD = HEAD;
		this._refs = refs;
		this._remotes = remotes;
		console.log('END');
		this._onDidChange.fire();
	}
}